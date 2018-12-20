const Big = require('big.js')
const Street = require('../src/street')

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
const k = new Big(4) // number of connections per node
const m = new Big(0.1) // probability of a node being malicious
const time = 5
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

  for (var i = 0; i < n; i++) {
    const rand = new Big(Math.random())
    const isMalicious = rand.lt(m)
    nodes.push({ isMalicious, name: i })
  }

  console.log('created nodes')

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

  console.log('connected nodes')

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

  console.log('interacted nodes')

  let credMatrix = {}
  const goodNodes = nodes.filter(node => !node.isMalicious)
  goodNodes.forEach(from => {
    credMatrix[from.name] = {}
    nodes.forEach(to => {
      const cred = street.cred(String(from.name), String(to.name), 0, clock.time())
      credMatrix[from.name][to.name] = {
        confidence: cred.confidence.toString().slice(0, 6),
        votes: cred.votes.toString().slice(0, 6),
        value: cred.value.toString().slice(0, 6)
      }
    })
  })
  console.log('done', credMatrix[0])
}

run()
