const TRUST_EDGE = 'trust'

class P2PTrust {
  constructor ({ metric, getClaims } = {}) {
    this.metric = metric
    this.getClaims = getClaims
  }

  peerConfidence (from, to) {
    const { confidence } = this.metric(this.getClaims, from, to, TRUST_EDGE)
    return confidence
  }

  claimConfidence (from, to, claimType) {
    return this.metric(this.getClaims, from, to, claimType)
  }
}

module.exports = P2PTrust
