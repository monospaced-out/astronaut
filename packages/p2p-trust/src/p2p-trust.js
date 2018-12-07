const jacobs = require('../metrics/jacobs/jacobs')
const Graph = require('@dagrejs/graphlib').Graph

const TRUST_EDGE = 'trust'
const WARNING_EDGE = 'warning'

const metrics = {
  jacobs
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

  getTrustClaim (from, to) {
    return this.graph.edge(from, to, TRUST_EDGE)
  }

  removeTrustClaim (from, to) {
    this.graph.removeEdge(from, to, TRUST_EDGE)
  }

  setWarningClaim (from, to, confidence) {
    this.graph.setEdge(from, to, confidence, WARNING_EDGE)
  }

  getWarningClaim (from, to) {
    return this.graph.edge(from, to, WARNING_EDGE)
  }

  removeWarningClaim (from, to) {
    this.graph.removeEdge(from, to, WARNING_EDGE)
  }

  getTrust (source, target) {
    return this.metric(this.graph, source, target, this.config)
  }
}

module.exports = P2PTrust
