const ss = require('simple-statistics')
const Big = require('big.js')
const P2PTrust = require('../../p2p-trust/src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')
const { Graph } = require('@dagrejs/graphlib')
const generateHtml = require('./confidence-html')
const fs = require('fs')

const ZERO = new Big(0)

const n = 20 // total number of nodes
const confidence = 0.5 // confidence to place in each trust claim
const accuracy = 0.9 // probability that each trust link is not mistakenly pointed to a malicious node
const knowledgeRatio = 0.5 // percent of nodes that have the knowledge (vs those that are trying to infer it)
const iterations = 10
// const repetitions = 3
const networkStructure = 'beta' // which network structure model to use

const beta = 0 // slider between randomness and order, inspired by beta model described in "Six Degrees"
const k = 4 // number of connections per node in beta model
const m = 7 // the `m` parameter from the Barabási–Albert model

const networkStructures = {
  // Watts-Strogatz (aka "beta") model: https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model
  beta: (nodes, setTrustClaim) => {
    nodes.forEach((node, nodeIndex) => {
      const maxDistance = k / 2
      for (var d = 1; d <= maxDistance; d++) {
        const above = randomlyRandom((nodeIndex + d) % n)
        const below = randomlyRandom((nodeIndex - d + n) % n)
        connect(setTrustClaim, nodes, node.name, nodes[above].name)
        connect(setTrustClaim, nodes, node.name, nodes[below].name)
      }
    })
  }
}

function run () {
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

  console.log('creating network structure...')

  for (var i = 0; i < n; i++) {
    nodes.push({ isMalicious: false, name: String(i) })
  }
  networkStructures[networkStructure](nodes, setTrustClaim)

  nodes.forEach(node => {
    const hasKnowledge = Math.random() < knowledgeRatio
    node.hasKnowledge = hasKnowledge
    if (hasKnowledge) {
      const value = node.isMalicious ? -1 : 1
      setClaim(node.name, value)
    }
  })

  console.log('gathering results...')

  const p2pTrust = new P2PTrust({
    getClaims,
    getValue,
    metric: jacobsMetric,
    useCache: true,
    iterations,
    nodes: nodes.map(n => n.name)
  })
  const goodNodes = nodes.filter(node => !node.isMalicious)
  const results = goodNodes.map(from => {
    const result = p2pTrust.claimConfidence(from.name, '0', 'something')
    const resultConfidence = Number(result.confidence.toString())
    const resultValue = Number(result.value.toString())
    const combined = resultValue * resultConfidence
    return { from, confidence: resultConfidence, value: resultValue, combined }
  })

  console.log('analyzing...')

  const meanConfidence = ss.mean(results.map(({ combined }) => combined))

  console.log('stats:')
  console.log({
    meanConfidence
  })
  const html = generateHtml(graph, nodes.filter(({ isMalicious }) => isMalicious).map(({ name }) => name))
  fs.writeFile('./simulations/confidence.html', html, () => {})
}

run()

function randomlyRandom (notRandom) {
  const rand1 = Math.random()
  if (rand1 > beta) {
    return notRandom
  } else {
    const rand2 = Math.random()
    return Math.floor(rand2 * n)
  }
}

function connect (setTrustClaim, nodes, a, b) {
  const isMistake = Math.random() > accuracy
  if (isMistake) {
    const maliciousNode = String(nodes.length)
    nodes.push({ isMalicious: true, name: maliciousNode })
    setTrustClaim(a, maliciousNode, confidence)
  } else {
    setTrustClaim(a, b, confidence)
  }
}
