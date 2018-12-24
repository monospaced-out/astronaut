const ss = require('simple-statistics')
const Big = require('big.js')
const P2PTrust = require('../../p2p-trust/src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')
const { Graph } = require('@dagrejs/graphlib')

const ZERO = new Big(0)

const networkModels = {
  // Watts-Strogatz (aka "beta") model: https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model
  beta: ({ nodes, n, setTrustClaim, modelOptions: { beta, k }, accuracy, confidence }) => {
    nodes.forEach((node, nodeIndex) => {
      const maxDistance = k / 2
      for (var d = 1; d <= maxDistance; d++) {
        const above = randomlyRandom({ notRandom: (nodeIndex + d) % n, n, beta })
        const below = randomlyRandom({ notRandom: (nodeIndex - d + n) % n, n, beta })
        connect({ setTrustClaim, nodes, a: node.name, b: nodes[above].name, accuracy, confidence })
        connect({ setTrustClaim, nodes, a: node.name, b: nodes[below].name, accuracy, confidence })
      }
    })
  },
  // Barabási–Albert model https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model
  ba: ({ graph, nodes, n, setTrustClaim, modelOptions: { m }, accuracy, confidence }) => {
    for (var i = 1; i < m + 1; i++) {
      connect({ setTrustClaim, nodes, a: nodes[i - 1].name, b: nodes[i].name, accuracy, confidence })
    }
    for (var a = m + 1; a < n; a++) {
      const edges = graph.edges()
      const trustEdges = edges.filter(e => e.name === 'trust')
      const probabilityUnits = trustEdges.reduce((acc, { v }) => {
        acc.push(v)
        return acc
      }, [])
      const nodesToConnect = ss.sample(probabilityUnits, m)
      nodesToConnect.forEach(b => {
        connect({ setTrustClaim, nodes, a: nodes[a].name, b: nodes[b].name, accuracy, confidence })
      })
    }
  }
}

function run ({ n, confidence, accuracy, knowledgeRatio, iterations, networkModel, modelOptions, updateProgress }) {
  const graph = new Graph({ multigraph: true })
  const getClaims = (from, claimType) => {
    const edges = graph.outEdges(from) || []
    const byType = edges.filter(e => e.name === claimType)
    return byType.map(e => {
      const { value, confidence } = graph.edge(e.v, e.w, claimType)
      return { value, confidence, to: e.w }
    })
  }
  const getValue = (claims) => {
    claims = claims.filter(c => c.value)

    // calculate mean value
    const weights = claims.map(({ confidence, value }) => {
      return confidence
    })
    const valueWeightedSum = claims.reduce((acc, { confidence, value }, i) => {
      return acc.plus(weights[i].times(value))
    }, ZERO)
    const weightSum = weights.reduce((acc, weight) => {
      return acc.plus(weight)
    }, ZERO)
    const meanWeightedValue = weightSum.eq(ZERO)
      ? ZERO
      : valueWeightedSum.div(weightSum)
    return meanWeightedValue
  }
  const setTrustClaim = (from, to, confidence) => {
    graph.setEdge(from, to, { confidence }, 'trust')
  }
  const setClaim = (from, value) => {
    graph.setEdge(from, '0', { confidence, value }, 'something')
  }
  const nodes = []

  updateProgress('creating network structure...')

  for (var i = 0; i < n; i++) {
    nodes.push({ isMalicious: false, name: String(i) })
  }
  networkModels[networkModel]({ graph, nodes, n, setTrustClaim, modelOptions, accuracy, confidence })

  nodes.forEach(node => {
    const hasKnowledge = Math.random() < knowledgeRatio
    node.hasKnowledge = hasKnowledge
    if (hasKnowledge) {
      const value = node.isMalicious ? -1 : 1
      setClaim(node.name, value)
    }
  })

  updateProgress('gathering results...')

  const p2pTrust = new P2PTrust({
    getClaims,
    getValue,
    metric: jacobsMetric,
    useCache: true,
    iterations,
    nodes: nodes.map(n => n.name)
  })
  const goodAgnosticNodes = nodes.filter(node => !node.isMalicious && !node.hasKnowledge)
  const results = goodAgnosticNodes.map(from => {
    const result = p2pTrust.claimConfidence(from.name, '0', 'something')
    const resultConfidence = Number(result.confidence.toString())
    const resultValue = Number(result.value.toString())
    const perceivedValue = resultValue * resultConfidence
    return { from, confidence: resultConfidence, value: resultValue, perceivedValue }
  })

  updateProgress('analyzing...')

  const perceivedValueMean = ss.mean(results.map(({ perceivedValue }) => perceivedValue))

  return {
    results,
    stats: {
      perceivedValueMean
    },
    graph,
    nodes
  }
}

function randomlyRandom ({ notRandom, n, beta }) {
  const rand1 = Math.random()
  if (rand1 > beta) {
    return notRandom
  } else {
    const rand2 = Math.random()
    return Math.floor(rand2 * n)
  }
}

function connect ({ setTrustClaim, nodes, a, b, accuracy, confidence }) {
  const isMistake = Math.random() > accuracy
  if (isMistake) {
    const maliciousNode = String(nodes.length)
    nodes.push({ isMalicious: true, name: maliciousNode })
    setTrustClaim(a, maliciousNode, confidence)
  } else {
    setTrustClaim(a, b, confidence)
  }
}

module.exports = run
