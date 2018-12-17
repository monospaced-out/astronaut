const Big = require('big.js')

const TRUST_CLAIM = 'trust'
const ZERO = new Big(0)
const ONE = new Big(1)

function helper (getClaims, source, target, claimType, visited) {
  // if (source === target) {
  //   return { confidence: ZERO, value: ONE }
  // }
  if (visited.includes(source)) {
    return { confidence: ZERO, value: ONE }
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(source)
  const trustClaims = getClaims(source, TRUST_CLAIM)
  const fromPeers = trustClaims.map(({ to, confidence }) => {
    const { confidence: peerConfidence, value } = helper(
      getClaims,
      to,
      target,
      claimType,
      newVisited
    )
    return { confidence: peerConfidence.times(new Big(confidence)), value }
  })
  const fromSelf = getClaims(source, claimType).find(({ to }) => to === target)
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

function jacobs (getClaims, source, target, claimType) {
  return helper(getClaims, source, target, claimType, [])
}

module.exports = jacobs
