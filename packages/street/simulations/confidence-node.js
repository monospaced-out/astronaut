const ss = require('simple-statistics')
const simulation = require('./confidence')

const n = 20 // total number of nodes
const confidence = 0.5 // confidence to place in each trust claim
const accuracy = 0 // probability that each trust link is not mistakenly pointed to a malicious node
const knowledgeRatio = 0.5 // percent of nodes that have the knowledge (vs those that are trying to infer it)
const iterations = 5 // number of iterations for jacobs metric
const networkModel = 'beta' // which network structure model to use

const beta = 0 // slider between randomness and order, inspired by beta model described in "Six Degrees"
const k = 4 // number of connections per node in beta model
const m = 3 // the `m` parameter from the Barabási–Albert model

const stabilizationTime = 50 // number of simulations to run to determine that the mean has stabilized

const desiredPrecision = {
  perceivedValueMean: 0.005
}

const results = []
let isStable = false
let i = 0
let currentResults
while (!isStable) {
  console.log(`running simulation ${i}...`)
  const result = simulation({
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
  results.push(result)
  const lists = results.reduce((acc, cur) => {
    Object.keys(cur).forEach(key => {
      const arr = acc[key] || []
      arr.push(cur[key])
      acc[key] = arr
    })
    return acc
  }, {})
  const previousResults = Object.assign({}, currentResults)
  currentResults = {}
  Object.keys(lists).forEach(stat => {
    const value = ss.mean(lists[stat])
    const queue = previousResults[stat] ? previousResults[stat].queue : []
    queue.push(value)
    if (queue.length > stabilizationTime) {
      queue.shift()
    }
    const minMax = queue.reduce(({ max, min }, cur) => {
      if (max === undefined) {
        return { max: cur, min: cur }
      } else {
        return { max: Math.max(max, cur), min: Math.min(min, cur) }
      }
    }, {})
    const isStable = (queue.length === stabilizationTime) && (minMax.max - minMax.min <= desiredPrecision[stat])
    currentResults[stat] = {
      value,
      queue,
      isStable
    }
  })
  isStable = Object.values(currentResults).reduce((acc, { isStable }) => acc && isStable, true)
  i++
  printStats()
}

console.log('done')
printStats()

function printStats () {
  console.log('stats:', Object.keys(currentResults).reduce((acc, cur) => {
    acc[cur] = currentResults[cur].value
    return acc
  }, {}))
}
