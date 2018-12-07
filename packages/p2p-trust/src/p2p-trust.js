const jacobs = require('../metrics/jacobs/jacobs')
const Graph = require('@dagrejs/graphlib').Graph

const TRUST_EDGE = 'trust'
const WARNING_EDGE = 'warning'

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
    this.graph.setEdge(from, to, confidence, TRUST_EDGE)
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

  setWarningClaim (from, to, confidence) {
    this.graph.setEdge(from, to, confidence, WARNING_EDGE)
  }

  warningClaimsTo (to) {
    return getClaims(this.graph, WARNING_EDGE, 'in', to)
  }

  warningClaimsFrom (from) {
    return getClaims(this.graph, WARNING_EDGE, 'out', from)
  }

  removeWarningClaim (from, to) {
    this.graph.removeEdge(from, to, WARNING_EDGE)
  }

  getTrust (source, target) {
    return this.metric(this.graph, source, target, this.config)
  }
}

module.exports = P2PTrust
