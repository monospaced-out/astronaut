const fs = require('fs')
const simulation = require('./confidence')
const generateHtml = require('./confidence-html')

const {
  n, // total number of nodes
  confidence, // confidence to place in each trust claim
  accuracy, // probability that each trust link is not mistakenly pointed to a malicious node
  knowledgeRatio, // percent of nodes that have the knowledge (vs those that are trying to infer it)
  iterations, // number of iterations for jacobs metric
  networkModel, // which network structure model to use
  modelOptions: {
    beta, // slider between randomness and order, inspired by beta model described in "Six Degrees"
    k, // number of connections per node in beta model
    m // the `m` parameter from the Barabási–Albert model
  }
} = require('./config.json')

const { stats, graph, nodes, results } = simulation({
  n,
  confidence,
  accuracy,
  knowledgeRatio,
  iterations,
  networkModel,
  modelOptions: { beta, k, m },
  updateProgress: (update) => {
    // console.log(update)
  }
})

const html = generateHtml(graph, nodes.filter(({ isMalicious }) => isMalicious).map(({ name }) => name))
fs.writeFile('./simulations/confidence.html', html, () => {})

console.log('results:', results)
console.log('stats:', stats)
