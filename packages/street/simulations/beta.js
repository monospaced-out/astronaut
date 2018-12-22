const Big = require('big.js')
const ss = require('simple-statistics')
const Street = require('../src/street')

const NEGATIVE_ONE = new Big(-1)
const ZERO = new Big(0)
const ONE = new Big(1)
const TWO = new Big(2)

class Clock {
  constructor () {
    this.state = 0
  }

  tick () {
    this.state++
  }

  time () {
    return this.state
  }
}

const n = new Big(100) // total number of nodes
const k = new Big(2) // number of connections per node in beta model
const time = 1
const confidence = new Big(0.5) // confidence to place in each trust claim
const accuracy = new Big(0.9) // probability that each trust link is not mistakenly pointed to a malicious node
const iterations = 5
const repetitions = 3
const beta = 0.5 // slider between randomness and order, inspired by beta model described in "Six Degrees"
const m = 7 // the `m` parameter from the Barabási–Albert model
const riskAversion = new Big(1) // how costly incorrect positive judgments are
const networkStructure = 'ba' // which network structure model to use
const degrees = {}

function getPayoff (cred, correctness, isMalicious) {
  if (cred.value.gt(ZERO)) {
    return isMalicious ? correctness.times(riskAversion) : correctness
  } else {
    return ZERO
  }
}

function connect (nodes, a, b, street) {
  const rand = new Big(Math.random())
  const isMistake = rand.gt(accuracy)
  if (isMistake) {
    const name = nodes.length
    nodes.push({ isMalicious: true, name })
    degrees[String(a.name)]++
    street.setTrust(String(a.name), String(name))
    return
  }
  if (a.name === b.name) {
    return
  }
  degrees[String(a.name)]++
  degrees[String(b.name)]++
  street.setTrust(String(a.name), String(b.name))
}

function randomlyRandom (notRandom) {
  const rand1 = new Big(Math.random())
  if (rand1.gt(beta)) {
    return notRandom
  } else {
    const rand2 = new Big(Math.random())
    return new Big(Math.floor(Number(rand2.times(n).toString())))
  }
}

const networkStructures = {
  // Watts-Strogatz (aka "beta") model: https://en.wikipedia.org/wiki/Watts%E2%80%93Strogatz_model
  beta: (nodes, street) => {
    nodes.forEach((node, nodeIndex) => {
      nodeIndex = new Big(nodeIndex)
      const maxDistance = k.div(TWO)
      for (var d = ONE; d.lte(maxDistance); d = d.plus(ONE)) {
        const above = randomlyRandom(nodeIndex.plus(d).mod(n))
        const below = randomlyRandom(nodeIndex.minus(d).plus(n).mod(n))
        connect(nodes, node, nodes[above.toString()], street)
        connect(nodes, node, nodes[below.toString()], street)
      }
    })
  },
  // Barabási–Albert model https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model
  ba: (nodes, street) => {
    for (var i = 1; i < m + 1; i++) {
      connect(nodes, nodes[i - 1], nodes[i], street)
    }
    for (var a = m + 1; a < n; a++) {
      const probabilityUnits = Object.values(degrees).reduce((acc, degree, index) => {
        for (var d = 0; d < degree; d++) {
          acc.push(index)
        }
        return acc
      }, [])
      const nodesToConnect = ss.sample(probabilityUnits, m)
      nodesToConnect.forEach(b => {
        connect(nodes, nodes[a], nodes[b], street)
      })
    }
  }
}

function run () {
  const nodes = []
  const street = new Street({ limit: 1, defaultConfidence: confidence, iterations })

  console.log('creating network structure...')

  for (var i = 0; i < n; i++) {
    degrees[String(i)] = 0
    nodes.push({ isMalicious: false, name: i })
  }
  networkStructures[networkStructure](nodes, street)

  console.log('interacting nodes...')

  const clock = new Clock()
  clock.tick()
  while (clock.time() < time + 1) {
    nodes.forEach((node) => {
      const rand = new Big(Math.random())
      const randomIndex = Math.floor(Number(rand.times(nodes.length).toString()))
      const randomNode = nodes[randomIndex]
      if ((node.isMalicious !== randomNode.isMalicious)) {
        street.removeCred(String(node.name), String(randomNode.name), clock.time())
      } else {
        street.addCred(String(node.name), String(randomNode.name), clock.time())
      }
    })
    clock.tick()
  }

  console.log('gathering results...')

  const resultMatrix = {}
  const flattened = []
  const goodNodes = nodes.filter(node => !node.isMalicious)
  goodNodes.forEach(from => {
    resultMatrix[from.name] = {}
    nodes.forEach(to => {
      const cred = street.cred(String(from.name), String(to.name), 0, clock.time())
      const correctness = to.isMalicious
        ? cred.value.times(cred.confidence).times(NEGATIVE_ONE).round(5)
        : cred.value.times(cred.confidence).round(5)
      const payoff = getPayoff(cred, correctness, to.isMalicious)
      resultMatrix[from.name][to.name] = {
        from: from.name,
        to: to.name,
        confidence: cred.confidence.toString().slice(0, 6),
        votes: cred.votes.toString().slice(0, 6),
        value: cred.value.toString().slice(0, 6),
        isMalicious: to.isMalicious,
        correctness: correctness.toString(),
        payoff: payoff.toString(),
        incorrectness: correctness.times(NEGATIVE_ONE).toString()
      }
      flattened.push(resultMatrix[from.name][to.name])
    })
  })

  console.log('analyzing...')

  const good = flattened.filter(({ isMalicious }) => !isMalicious)
  const bad = flattened.filter(({ isMalicious }) => isMalicious)
  const payoffs = flattened.map(({ payoff }) => Number(payoff))
  const goodInteractions = good.length
  const badInteractions = bad.length
  const goodCorrect = good.filter(({ correctness }) => correctness > 0)
  const goodIncorrect = good.filter(({ correctness }) => correctness < 0)
  const badCorrect = bad.filter(({ correctness }) => correctness > 0)
  const badIncorrect = bad.filter(({ correctness }) => correctness < 0)
  const worstPayoff = ss.min(payoffs)
  const positivePayoffMean = ss.mean(payoffs.filter(p => p > 0))
  const negativePayoffMean = ss.mean(payoffs.filter(p => p < 0))
  const failureRate = (badIncorrect.length + goodIncorrect.length) / flattened.length
  const successRate = (badCorrect.length + goodCorrect.length) / flattened.length
  const decisionRate = flattened.filter(({ correctness }) => Number(correctness) !== 0).length / flattened.length
  const payoffMean = ss.mean(payoffs)
  const payoffMedian = ss.median(payoffs)
  const payoffVariance = ss.variance(payoffs)
  const payoffSkewness = ss.sampleSkewness(payoffs)
  const payoff95Percentile = ss.quantile(payoffs.map(p => p * -1), 0.95) * -1
  const negativePayoff95Percentile = ss.quantile(payoffs.filter(p => p < 0).map(p => p * -1), 0.95) * -1
  const positivePayoffQuantileRank = ss.quantileRank(payoffs.filter(p => p > 0).map(p => p * -1), negativePayoff95Percentile)
  const nonNegativePayoffs = payoffs.filter(p => p >= 0).length / flattened.length

  return {
    goodInteractions,
    badInteractions,
    worstPayoff,
    positivePayoffMean,
    negativePayoffMean,
    decisionRate,
    successRate,
    failureRate,
    payoffMean,
    payoffMedian,
    payoffVariance,
    payoffSkewness,
    payoff95Percentile, // 95 percent of payoffs greater than this
    negativePayoff95Percentile,
    positivePayoffQuantileRank,
    nonNegativePayoffs // percent of payoffs >= 0
  }
}

const results = []
for (var i = 1; i <= repetitions; i++) {
  console.log(`repetition ${i}:`)
  results.push(run())
}
const lists = results.reduce((acc, cur) => {
  Object.keys(cur).forEach(key => {
    const arr = acc[key] || []
    arr.push(cur[key])
    acc[key] = arr
  })
  return acc
}, {})
const averages = {}
Object.keys(lists).forEach(stat => {
  averages[stat] = ss.mean(lists[stat])
})
console.log('averages', averages)
