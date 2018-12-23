const ss = require('simple-statistics')
const simulation = require('./confidence')

const simulationCount = 100

const n = 20 // total number of nodes
const confidence = 0.5 // confidence to place in each trust claim
const accuracy = 0.9 // probability that each trust link is not mistakenly pointed to a malicious node
const knowledgeRatio = 0.5 // percent of nodes that have the knowledge (vs those that are trying to infer it)
const iterations = 5 // number of iterations for jacobs metric
const networkModel = 'ba' // which network structure model to use

const beta = 0 // slider between randomness and order, inspired by beta model described in "Six Degrees"
const k = 4 // number of connections per node in beta model
const m = 3 // the `m` parameter from the Barabási–Albert model

const results = []
for (var i = 1; i <= simulationCount; i++) {
  console.log(`simulation ${i}:`)
  results.push(simulation({
    n,
    confidence,
    accuracy,
    knowledgeRatio,
    iterations,
    networkModel,
    modelOptions: { beta, k, m }
  }))
}
const lists = results.reduce((acc, cur) => {
  Object.keys(cur).forEach(key => {
    const arr = acc[key] || []
    arr.push(cur[key])
    acc[key] = arr
  })
  return acc
}, {})
const averages = {}
Object.keys(lists).forEach(stat => {
  averages[stat] = ss.mean(lists[stat])
})
console.log('stats:', averages)
