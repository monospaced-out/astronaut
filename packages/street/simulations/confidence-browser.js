const fs = require('fs')
const simulation = require('./confidence')
const generateHtml = require('./confidence-html')

const n = 20 // total number of nodes
const confidence = 0.5 // confidence to place in each trust claim
const accuracy = 0.5 // probability that each trust link is not mistakenly pointed to a malicious node
const knowledgeRatio = 0.5 // percent of nodes that have the knowledge (vs those that are trying to infer it)
const iterations = 5 // number of iterations for jacobs metric
const networkModel = 'beta' // which network structure model to use

const beta = 0 // slider between randomness and order, inspired by beta model described in "Six Degrees"
const k = 4 // number of connections per node in beta model
const m = 3 // the `m` parameter from the Barabási–Albert model

const { stats, graph, nodes } = simulation({
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

console.log('stats:', stats)
