const Big = require('big.js')
const ss = require('simple-statistics')
const Street = require('../src/street')

const NEGATIVE_ONE = new Big(-1)
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

const n = new Big(50) // total number of nodes
const k = new Big(4) // number of connections per node
const m = new Big(0.5) // probability of a node being malicious
const time = 1
const confidence = new Big(0.5) // confidence to place in each trust claim
const accuracy = new Big(0.5) // probability that each trust link is not mistakenly pointed to a malicious node
// const beta = 0

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
  const street = new Street({ limit: 1, defaultConfidence: confidence })

  console.log('creating nodes..')

  for (var i = 0; i < n; i++) {
    const rand = new Big(Math.random())
    const isMalicious = rand.lt(m)
    nodes.push({ isMalicious, name: i })
  }

  console.log('connecting nodes...')

  nodes.forEach((node, nodeIndex) => {
    nodeIndex = new Big(nodeIndex)
    const maxDistance = k.div(TWO)
    for (var d = ONE; d.lte(maxDistance); d = d.plus(ONE)) {
      const above = nodeIndex.plus(d).mod(n)
      const below = nodeIndex.minus(d).plus(n).mod(n)
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
      resultMatrix[from.name][to.name] = {
        from: from.name,
        to: to.name,
        confidence: cred.confidence.toString().slice(0, 6),
        votes: cred.votes.toString().slice(0, 6),
        value: cred.value.toString().slice(0, 6),
        isMalicious: to.isMalicious,
        correctness: correctness.toString(),
        incorrectness: correctness.times(NEGATIVE_ONE).toString()
      }
      flattened.push(resultMatrix[from.name][to.name])
    })
  })

  console.log('analyzing...')

  const getCorrectness = (arr) => {
    return arr.map(({ correctness }) => {
      return Number(correctness)
    })
  }

  const getIncorrectness = (arr) => {
    return arr.map(({ incorrectness }) => {
      return Number(incorrectness)
    })
  }

  const good = flattened.filter(({ isMalicious }) => !isMalicious)
  const bad = flattened.filter(({ isMalicious }) => isMalicious)
  const goodCorrect = good.filter(({ correctness }) => correctness > 0)
  const goodIncorrect = good.filter(({ correctness }) => correctness < 0)
  const badCorrect = bad.filter(({ correctness }) => correctness > 0)
  const badIncorrect = bad.filter(({ correctness }) => correctness < 0)
  const goodMean = ss.mean(getCorrectness(good))
  const goodMedian = ss.median(getCorrectness(good))
  const goodVariance = ss.variance(getCorrectness(good))
  const goodQuantile = ss.quantile(getIncorrectness(good), 0.95) * -1
  const goodQuantileRank = ss.quantileRank(getIncorrectness(good), 0)
  const badMean = ss.mean(getCorrectness(bad))
  const badMedian = ss.median(getCorrectness(bad))
  const badVariance = ss.variance(getCorrectness(bad))
  const badQuantile = ss.quantile(getCorrectness(bad), 0.95)
  const badQuantileRank = ss.quantileRank(getCorrectness(bad), 0)
  const failureRate = (badIncorrect.length + goodIncorrect.length) / flattened.length
  const successRate = (badCorrect.length + goodCorrect.length) / flattened.length

  const half = Math.round(flattened.length / 2)
  const bayes = new ss.BayesianClassifier()
  flattened.slice(0, half).forEach(({ value, confidence, isMalicious }) => {
    bayes.train({ value, confidence }, isMalicious)
  })

  const stats = {
    goodMean,
    goodMedian,
    goodVariance,
    goodQuantile,
    goodQuantileRank,
    badMean,
    badMedian,
    badVariance,
    badQuantile,
    badQuantileRank,
    successRate,
    failureRate
  }

  console.log('done')
  console.log(stats)
}

run()
