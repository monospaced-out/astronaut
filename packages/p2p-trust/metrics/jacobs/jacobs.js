const Big = require('big.js')

const TRUST_EDGE = 'trust'
const WARNING_EDGE = 'warning'
const ZERO = new Big(0)
const ONE = new Big(1)

function helper (graph, source, target, visited) {
  if (source === target) {
    return { trust: ONE, warning: ZERO }
  }
  if (visited.includes(source)) {
    return { trust: ZERO, warning: ZERO }
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(source)
  const claims = graph.outEdges(source)
  const trustClaims = claims.filter(e => e.name === TRUST_EDGE)
  const doubts = trustClaims.map((claim) => {
    const confidence = new Big(graph.edge(claim.v, claim.w, TRUST_EDGE))
    const { trust: trustFromPeer, warning: warningFromPeer } = helper(
      graph,
      claim.w,
      target,
      newVisited
    )
    const trustThroughPeer = trustFromPeer.times(confidence)
    const warningThroughPeer = warningFromPeer.times(confidence)
    const trustDoubt = ONE.minus(trustThroughPeer)
    const warningDoubt = ONE.minus(warningThroughPeer)
    return { trustDoubt, warningDoubt }
  })
  const totalDoubt = doubts.reduce((acc, cur) => {
    return {
      trustDoubt: acc.trustDoubt.times(cur.trustDoubt),
      warningDoubt: acc.warningDoubt.times(cur.warningDoubt)
    }
  }, { trustDoubt: ONE, warningDoubt: ONE })
  const trust = ONE.minus(totalDoubt.trustDoubt)
  const warningClaim = claims.find(e => {
    return (e.name === WARNING_EDGE) && (e.w === target)
  })
  const directWarning = warningClaim
    ? new Big(graph.edge(warningClaim.v, warningClaim.w, WARNING_EDGE))
    : ZERO
  const directWarningDoubt = ONE.minus(directWarning)
  const warningDoubt = totalDoubt.warningDoubt.times(directWarningDoubt)
  const warning = ONE.minus(warningDoubt)
  return { trust, warning }
}

function jacobs (graph, source, target, config) {
  const { trust, warning } = helper(graph, source, target, [], new Big(config.confidence || 0.5), config.gradient)
  return ONE.minus(warning).times(trust)
}

module.exports = jacobs
