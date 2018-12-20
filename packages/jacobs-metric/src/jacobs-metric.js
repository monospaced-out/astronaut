const Big = require('big.js')

const TRUST_CLAIM = 'trust'
const ONE = new Big(1)

function helper (getClaims, getValue, current, target, claimType, currentValues, dp) {
  const trustClaims = getClaims(current, TRUST_CLAIM)
  const fromPeers = trustClaims.map(({ to, confidence }) => {
    const fromPeer = currentValues[to][target]
    if (!fromPeer) {
      return
    }
    return {
      confidence: fromPeer.confidence.times(new Big(confidence)).round(dp),
      value: fromPeer.value
    }
  }).filter(c => c) // remove undefined values
  const fromSelf = getClaims(current, claimType).find(({ to }) => to === target)
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
    return acc.times(cur).round(dp)
  }, ONE)
  const confidence = ONE.minus(totalDoubt)
  const value = getValue(repClaims)
  return { confidence, value }
}

function jacobs (getClaims, getValue, source, target, claimType, cache, config) {
  if (cache && cache['currentValues']) {
    return cache['currentValues'][source][target]
  }
  const { iterations, nodes, dp } = config
  const currentValues = {}
  nodes.forEach(a => {
    currentValues[a] = {}
  })
  for (var i = 0; i < iterations; i++) {
    nodes.forEach(a => {
      nodes.forEach(b => {
        currentValues[a][b] = helper(getClaims, getValue, a, b, claimType, currentValues, dp)
      })
    })
  }
  if (cache) {
    cache['currentValues'] = currentValues
  }
  return currentValues[source][target]
}

module.exports = jacobs
