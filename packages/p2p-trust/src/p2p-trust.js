const TRUST_EDGE = 'trust'

class P2PTrust {
  constructor ({ metric, getClaims, getValue } = {}) {
    this.metric = metric
    this.getClaims = getClaims
    this.getValue = getValue
  }

  peerConfidence (from, to) {
    const { confidence } = this.metric(this.getClaims, this.getValue, from, to, TRUST_EDGE)
    return confidence
  }

  claimConfidence (from, to, claimType) {
    return this.metric(this.getClaims, this.getValue, from, to, claimType)
  }
}

module.exports = P2PTrust
