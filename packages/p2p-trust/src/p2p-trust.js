const TRUST_EDGE = 'trust'

class P2PTrust {
  constructor (config = {}) {
    const { metric, getClaims, getValue, useCache } = config
    this.metric = metric
    this.getClaims = getClaims
    this.getValue = getValue
    if (useCache) {
      this.cache = {}
    }
    this.config = config
  }

  peerConfidence (from, to) {
    const { confidence } = this.metric(this.getClaims, this.getValue, from, to, TRUST_EDGE)
    return confidence
  }

  claimConfidence (from, to, claimType) {
    return this.metric(this.getClaims, this.getValue, from, to, claimType, this.cache, this.config)
  }

  clearCache () {
    this.cache = {}
  }
}

module.exports = P2PTrust
