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
graph1.setEdge('a', 'b')

/*
  graph 2:

  a
  |
  b
  |
  c
*/
const graph2 = new Graph()
graph2.setEdge('a', 'b')
graph2.setEdge('b', 'c')

/*
  graph 3:

    a
   / \
  b   c
   \ /
    d
*/
const graph3 = new Graph()
graph3.setEdge('a', 'b')
graph3.setEdge('a', 'c')
graph3.setEdge('b', 'd')
graph3.setEdge('c', 'd')

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

  it('should allow confidence to be configured', async function () {
    const p2pTrust = new P2PTrust({ confidence: 0.8 })
    const trust = p2pTrust.getTrust(graph3, 'a', 'd')
    assert.strictEqual(trust.toString(), '0.8704')
  })

  it('should allow gradient to be configured', async function () {
    const gradient = confidence => {
      return new Big(0.5).times(confidence)
    }
    const p2pTrust = new P2PTrust({ gradient })
    const trust = p2pTrust.getTrust(graph3, 'a', 'd')
    assert.strictEqual(trust.toString(), '0.234375')
  })
})
