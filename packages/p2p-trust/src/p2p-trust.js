const jacobs = require('../metrics/jacobs/jacobs')
const Graph = require('@dagrejs/graphlib').Graph

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
    this.graph = new Graph()
    this.config = config
  }

  setLink (from, to, confidence) {
    this.graph.setEdge(from, to, confidence)
  }

  getLink (from, to) {
    return this.graph.edge(from, to)
  }

  removeLink (from, to) {
    this.graph.removeEdge(from, to)
  }

  getDegree (source, target) {
    return this.metric(this.graph, source, target, this.config)
  }
}

module.exports = P2PTrust
