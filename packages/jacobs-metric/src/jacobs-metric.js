const Big = require('big.js')

const TRUST_CLAIM = 'trust'
const ONE = new Big(1)

function helper (getClaims, getValue, caller, current, target, claimType, visited) {
  if (visited.includes(current)) {
    return
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(current)
  const trustClaims = getClaims(caller, current, TRUST_CLAIM)
  const fromPeers = trustClaims.map(({ to, confidence }) => {
    const fromPeer = helper(
      getClaims,
      getValue,
      current,
      to,
      target,
      claimType,
      newVisited
    )
    if (!fromPeer) {
      return
    }
    return {
      confidence: fromPeer.confidence.times(new Big(confidence)),
      value: fromPeer.value
    }
  }).filter(c => c) // remove undefined values
  const fromSelf = getClaims(caller, current, claimType).find(({ to }) => to === target)
  const repClaims = fromSelf
    ? fromPeers.concat({
      value: fromSelf.value,
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
  const value = getValue(repClaims)
  return { confidence, value }
}

function jacobs (getClaims, getValue, source, target, claimType) {
  return helper(getClaims, getValue, null, source, target, claimType, [])
}

module.exports = jacobs
