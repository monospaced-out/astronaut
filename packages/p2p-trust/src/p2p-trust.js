const jacobs = require('../metrics/jacobs/jacobs')
const Graph = require('@dagrejs/graphlib').Graph

const TRUST_EDGE = 'trust'
const customClaim = (claimType) => {
  return `claim:${claimType}`
}

const metrics = {
  jacobs
}

function getClaims (graph, type, direction, a, b) {
  const method = direction === 'in' ? 'inEdges' : 'outEdges'
  return graph[method](a, b).filter(e => {
    return e.name === type
  }).map(e => {
    return {
      from: e.v,
      to: e.w,
      confidence: graph.edge(e.v, e.w, type)
    }
  })
}

class P2PTrust {
  constructor (config = {}) {
    const metric = config.metric || 'jacobs'
    if (typeof metric === 'string') {
      this.metric = metrics[metric]
    } else {
      this.metric = metric
    }
    this.graph = new Graph({ multigraph: true })
    this.config = config
  }

  setTrustClaim (from, to, confidence) {
    confidence = confidence || this.config.defaultConfidence
    this.graph.setEdge(from, to, { confidence, value: 1 }, TRUST_EDGE)
  }

  trustClaimsTo (to) {
    return getClaims(this.graph, TRUST_EDGE, 'in', to)
  }

  trustClaimsFrom (from) {
    return getClaims(this.graph, TRUST_EDGE, 'out', from)
  }

  removeTrustClaim (from, to) {
    this.graph.removeEdge(from, to, TRUST_EDGE)
  }

  peerTrust (source, target) {
    const { confidence } = this.metric(this.graph, source, target, TRUST_EDGE, this.config)
    return confidence
  }

  setClaim (from, to, claimType, value = 1) {
    this.graph.setEdge(from, to, { confidence: 1, value }, customClaim(claimType))
  }

  claimsTo (to, claimType) {
    return getClaims(this.graph, customClaim(claimType), 'in', to)
  }

  claimsFrom (from, claimType) {
    return getClaims(this.graph, customClaim(claimType), 'out', from)
  }

  removeClaim (from, to, claimType) {
    this.graph.removeEdge(from, to, customClaim(claimType))
  }

  claimTrust (source, target, claimType) {
    return this.metric(this.graph, source, target, customClaim(claimType), this.config)
  }
}

module.exports = P2PTrust
