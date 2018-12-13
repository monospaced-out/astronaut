const Big = require('big.js')

const TRUST_EDGE = 'trust'
const ZERO = new Big(0)
const ONE = new Big(1)

function helper (graph, source, target, visited) {
  if (source === target) {
    return ONE
  }
  if (visited.includes(source)) {
    return ZERO
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(source)
  const claims = graph.outEdges(source)
  const trustClaims = claims.filter(e => e.name === TRUST_EDGE)
  const doubts = trustClaims.map((claim) => {
    const confidence = new Big(graph.edge(claim.v, claim.w, TRUST_EDGE))
    const trustFromPeer = helper(
      graph,
      claim.w,
      target,
      newVisited
    )
    const trustThroughPeer = trustFromPeer.times(confidence)
    const trustDoubt = ONE.minus(trustThroughPeer)
    return trustDoubt
  })
  const totalDoubt = doubts.reduce((acc, cur) => {
    return acc.times(cur)
  }, ONE)
  return ONE.minus(totalDoubt)
}

function jacobs (graph, source, target, config) {
  return helper(graph, source, target, [], new Big(config.confidence || 0.5), config.gradient)
}

module.exports = jacobs
