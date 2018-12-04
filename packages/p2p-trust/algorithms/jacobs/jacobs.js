const Big = require('../../big')

function helper (graph, source, target, visited, currentConfidence, gradient) {
  if (source === target) {
    return new Big(1)
  }
  if (visited.includes(source)) {
    return new Big(0)
  }
  let newVisited = visited.slice(0) // clone array
  newVisited.push(source)
  const successors = graph.successors(source)
  const doubts = successors.map((successor) => {
    const fromSuccessor = helper(
      graph,
      successor,
      target,
      newVisited,
      gradient ? gradient(currentConfidence) : currentConfidence,
      gradient
    )
    const throughSuccessor = fromSuccessor.times(currentConfidence)
    return new Big(1).minus(throughSuccessor)
  })
  const totalDoubt = doubts.reduce((acc, cur) => acc.times(cur), new Big(1))
  return new Big(1).minus(totalDoubt)
}

function jacobs (graph, source, target, config) {
  return helper(graph, source, target, [], new Big(config.confidence || 0.5), config.gradient)
}

module.exports = jacobs
