const Big = require('big.js')

const TRUST_EDGE = 'trust'
const ZERO = new Big(0)
const ONE = new Big(1)

function helper (graph, source, target, claimType, visited) {
  if (source === target) {
    return { confidence: ZERO, value: ONE }
  }
  if (visited.includes(source)) {
    return { confidence: ZERO, value: ONE }
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(source)
  const claims = graph.outEdges(source)
  const trustClaims = claims.filter(e => e.name === TRUST_EDGE)
  const fromPeers = trustClaims.map((claim) => {
    const confidence = new Big(graph.edge(claim.v, claim.w, TRUST_EDGE).confidence)
    const { confidence: peerConfidence, value } = helper(
      graph,
      claim.w,
      target,
      claimType,
      newVisited
    )
    return { confidence: peerConfidence.times(confidence), value }
  })
  const fromSelf = graph.edge(source, target, claimType)
  const repClaims = fromSelf
    ? fromPeers.concat({
      value: new Big(fromSelf.value),
      confidence: new Big(fromSelf.confidence)
    })
    : fromPeers
  const doubts = repClaims.map(({ confidence }) => {
    return ONE.minus(confidence)
  })
  const totalDoubt = doubts.reduce((acc, cur) => {
    return acc.times(cur)
  }, ONE)
  const confidence = ONE.minus(totalDoubt)
  const valueWeightedSum = repClaims.reduce((acc, { confidence, value }) => {
    return acc.plus(confidence.times(value))
  }, ZERO)
  const confidenceSum = repClaims.reduce((acc, { confidence }) => {
    return acc.plus(confidence)
  }, ZERO)
  const valueWeightedAverage = confidenceSum.eq(ZERO)
    ? ONE
    : valueWeightedSum.div(confidenceSum)
  return { confidence, value: valueWeightedAverage }
}

function jacobs (graph, source, target, claimType, config) {
  return helper(graph, source, target, claimType, [])
}

module.exports = jacobs
