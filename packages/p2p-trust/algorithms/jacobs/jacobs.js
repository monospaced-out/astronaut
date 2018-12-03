function helper (graph, source, target, visited, currentDiscount, gradient) {
  if (source === target) {
    return 1
  }
  if (visited.includes(source)) {
    return 0
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
      gradient ? gradient(currentDiscount) : currentDiscount,
      gradient
    )
    const toSuccessor = 1 - currentDiscount
    const throughSuccessor = toSuccessor * fromSuccessor
    return 1 - throughSuccessor
  })
  const totalDoubt = doubts.reduce((acc, cur) => acc * cur, 1)
  return 1 - totalDoubt
}

function jacobs (graph, source, target, config) {
  return helper(graph, source, target, [], config.discount || 0.5, config.gradient)
}

module.exports = jacobs
