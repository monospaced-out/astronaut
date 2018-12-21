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

const n = new Big(80) // total number of nodes
const k = new Big(4) // number of connections per node
const m = new Big(0.5) // probability of a node being malicious
const time = 1
const confidence = new Big(0.9) // confidence to place in each trust claim
const accuracy = new Big(0.9) // probability that each trust link is not mistakenly pointed to a malicious node
const iterations = 20
const repetitions = 10
const beta = 1
const riskAversion = new Big(2) // how costly incorrect positive judgments are

function connect (a, b, street) {
  if (a.name === b.name) {
    return
  }
  const rand = new Big(Math.random())
  const isMistake = rand.gt(accuracy)
  if (b.isMalicious === isMistake) {
    street.setTrust(String(a.name), String(b.name))
  }
}

function run () {
  const nodes = []
  const street = new Street({ limit: 1, defaultConfidence: confidence, iterations })

  console.log('creating nodes..')

  for (var i = 0; i < n; i++) {
    const rand = new Big(Math.random())
    const isMalicious = rand.lt(m)
    nodes.push({ isMalicious, name: i })
  }

  console.log('connecting nodes...')

  const randomlyRandom = (notRandom) => {
    const rand1 = new Big(Math.random())
    if (rand1.gt(beta)) {
      return notRandom
    } else {
      const rand2 = new Big(Math.random())
      return new Big(Math.floor(Number(rand2.times(n).toString())))
    }
  }

  nodes.forEach((node, nodeIndex) => {
    nodeIndex = new Big(nodeIndex)
    const maxDistance = k.div(TWO)
    for (var d = ONE; d.lte(maxDistance); d = d.plus(ONE)) {
      const above = randomlyRandom(nodeIndex.plus(d).mod(n))
      const below = randomlyRandom(nodeIndex.minus(d).plus(n).mod(n))
      connect(node, nodes[above.toString()], street)
      connect(node, nodes[below.toString()], street)
    }
  })

  console.log('interacting nodes...')

  const clock = new Clock()
  clock.tick()
  while (clock.time() < time + 1) {
    nodes.forEach((node, nodeIndex) => {
      nodeIndex = new Big(nodeIndex)
      const rand = new Big(Math.random())
      const randomIndex = Math.floor(Number(rand.times(n).toString()))
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
      const payoff = (to.isMalicious && cred.value.gt(ZERO))
        ? correctness.times(riskAversion)
        : correctness
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
  const goodCorrect = good.filter(({ correctness }) => correctness > 0)
  const goodIncorrect = good.filter(({ correctness }) => correctness < 0)
  const badCorrect = bad.filter(({ correctness }) => correctness > 0)
  const badIncorrect = bad.filter(({ correctness }) => correctness < 0)
  const failureRate = (badIncorrect.length + goodIncorrect.length) / flattened.length
  const successRate = (badCorrect.length + goodCorrect.length) / flattened.length
  const payoffs = flattened.map(({ payoff }) => Number(payoff))
  const payoffMean = ss.mean(payoffs)
  const payoffMedian = ss.median(payoffs)
  const payoffVariance = ss.variance(payoffs)
  const payoffSkewness = ss.sampleSkewness(payoffs)
  const payoff95Percentile = ss.quantile(payoffs.map(p => p * -1), 0.95) * -1
  const payoffsAbove0 = ss.quantileRank(payoffs.map(p => p * -1), 0.000001)

  return {
    successRate,
    failureRate,
    payoffMean,
    payoffMedian,
    payoffVariance,
    payoffSkewness,
    payoff95Percentile,
    payoffsAbove0
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
