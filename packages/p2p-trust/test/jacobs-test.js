/* globals describe, it */

const Big = require('../big')

const P2PTrust = require('../src/p2p-trust')
const Graph = require('../graph')
const assert = require('assert')

/*
  graph 1:

  a
  |
  b
*/
const graph1 = new Graph()
graph1.setEdge('a', 'b', 0.5)

/*
  graph 2:

  a
  |
  b
  |
  c
*/
const graph2 = new Graph()
graph2.setEdge('a', 'b', 0.5)
graph2.setEdge('b', 'c', 0.5)

/*
  graph 3:

    a
   / \
  b   c
   \ /
    d
*/
const graph3 = new Graph()
graph3.setEdge('a', 'b', 0.5)
graph3.setEdge('a', 'c', 0.5)
graph3.setEdge('b', 'd', 0.5)
graph3.setEdge('c', 'd', 0.5)

/*
  graph 4:

    a
   / \
  b   c
   \ /
    d
    |
    e
*/
const graph4 = new Graph()
graph4.setEdge('a', 'b', 1)
graph4.setEdge('a', 'c', 1)
graph4.setEdge('b', 'd', 1)
graph4.setEdge('c', 'd', 1)
graph4.setEdge('d', 'e', 1)
graph4.setNode('f')

/*
  graph 5:

    a
   / \   <- 0.5
  b   c
   \ /   <- 0.25
    d
*/
const graph5 = new Graph()
graph5.setEdge('a', 'b', 0.5)
graph5.setEdge('a', 'c', 0.5)
graph5.setEdge('b', 'd', 0.25)
graph5.setEdge('c', 'd', 0.25)

describe('jacobs algorithm', function () {
  it('should correctly score a neighbor', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph1, 'a', 'b')
    assert.strictEqual(trust.toString(), '0.5')
  })

  it('should correctly score a second-degree connection', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph2, 'a', 'c')
    assert.strictEqual(trust.toString(), '0.25')
  })

  it('should correctly take into account multiple paths', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph3, 'a', 'd')
    assert.strictEqual(trust.toString(), '0.4375')
  })

  it('should return 1 when all trust links have confidence of 1', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph4, 'a', 'e')
    assert.strictEqual(trust.toString(), '1')
  })

  it('should return 0 when there is no connecting path', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph4, 'a', 'f')
    assert.strictEqual(trust.toString(), '0')
  })

  it('should handle multiple confidence levels', async function () {
    const p2pTrust = new P2PTrust()
    const trust = p2pTrust.getTrust(graph5, 'a', 'd')
    assert.strictEqual(trust.toString(), '0.234375')
  })
})
