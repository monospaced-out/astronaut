const jacobs = require('../algorithms/jacobs/jacobs')

const algorithms = {
  jacobs
}

class P2PTrust {
  constructor (config = {}) {
    const algorithm = config.algorithm || 'jacobs'
    if (typeof algorithm === 'string') {
      this.algorithm = algorithms[algorithm]
    } else {
      this.algorithm = algorithm
    }
    this.config = config
  }

  getTrust (graph, source, target) {
    return this.algorithm(graph, source, target, this.config)
  }
}

module.exports = P2PTrust
