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
const time = 100
const confidence = new Big(0.5) // confidence to place in each trust claim
const accuracy = new Big(0.5) // probability that each trust link is not mistakenly pointed to a malicious node
// const beta = 0

function connect (a, b, street) {
  if (a.name === b.name) {
    return
  }
  if (b.isMalicious) {
    const rand = new Big(Math.random())
    const isMistake = rand.gt(accuracy)
    if (isMistake) {
      street.setTrust(String(a.name), String(b.name))
    }
  } else {
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
      if ((node.isMalicious && !randomNode.isMalicious) || (!node.isMalicious && randomNode.isMalicious)) {
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
        ? cred.votes.times(cred.confidence).times(cred.value).times(NEGATIVE_ONE).round(5)
        : cred.votes.times(cred.confidence).times(cred.value).round(5)
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

  const correctnesses = flattened.map(({ correctness }) => Number(correctness))
  const incorrectnesses = flattened.map(({ incorrectness }) => Number(incorrectness))
  const meanCorrectness = ss.mean(correctnesses)
  const medianCorrectness = ss.median(correctnesses)
  const correctQuantile = ss.quantileRank(incorrectnesses, 0)

  const half = Math.round(flattened.length / 2)
  const bayes = new ss.BayesianClassifier()
  flattened.slice(0, half).forEach(({ value, confidence, isMalicious }) => {
    bayes.train({ value, confidence }, isMalicious)
  })
  const bayesianIncorrectnesses = flattened.slice(half).map(({ value, confidence, isMalicious }) => {
    const score = bayes.score({ value, confidence })
    return isMalicious ? score.false - score.true : score.true - score.false
  })
  const bayesianCorrectQuantile = ss.quantileRank(bayesianIncorrectnesses, 0)

  const stats = {
    meanCorrectness,
    medianCorrectness,
    correctQuantile,
    bayesianCorrectQuantile
  }

  console.log('done')
  console.log(stats)
}

run()
