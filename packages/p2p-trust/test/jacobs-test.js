/* globals describe, it, beforeEach */

const P2PTrust = require('../src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')
const { Graph } = require('@dagrejs/graphlib')
const assert = require('assert')
const TRUST_CLAIM = 'trust'

let p2pTrust, setClaim, setTrustClaim

describe('jacobs algorithm', function () {
  beforeEach(() => {
    const graph = new Graph({ multigraph: true })
    const getClaims = (caller, from, claimType) => {
      const edges = graph.outEdges(from)
      const byType = edges.filter(e => e.name === claimType)
      return byType.map(e => {
        const { value, confidence } = graph.edge(e.v, e.w, claimType)
        return { value, confidence, to: e.w }
      })
    }
    setClaim = (from, to, claimType, value, confidence = 1) => {
      graph.setEdge(from, to, { value, confidence }, claimType)
    }
    setTrustClaim = (from, to, confidence) => {
      setClaim(from, to, TRUST_CLAIM, 1, confidence)
    }
    p2pTrust = new P2PTrust({ getClaims, metric: jacobsMetric })
  })

  describe('peerConfidence', function () {
    it('should retrieve trust for a neighbor', async function () {
      /*
        a
        |
        b
      */
      setTrustClaim('a', 'b', 0.5)
      const trust = p2pTrust.peerConfidence('a', 'b')
      assert.strictEqual(trust.toString(), '0.5')
    })

    it('should score a second-degree connection', async function () {
      /*
        a
        |
        b
        |
        c
      */
      setTrustClaim('a', 'b', 0.5)
      setTrustClaim('b', 'c', 0.5)
      const trust = p2pTrust.peerConfidence('a', 'c')
      assert.strictEqual(trust.toString(), '0.25')
    })

    it('should take into account multiple paths', async function () {
      /*
          a
         / \
        b   c
         \ /
          d
      */
      setTrustClaim('a', 'b', 0.5)
      setTrustClaim('a', 'c', 0.5)
      setTrustClaim('b', 'd', 0.5)
      setTrustClaim('c', 'd', 0.5)
      const trust = p2pTrust.peerConfidence('a', 'd')
      assert.strictEqual(trust.toString(), '0.4375')
    })

    it('should return 1 when all trust links have confidence of 1', async function () {
      /*
          a
         / \
        b   c
         \ /
          d
          |
          e
      */
      setTrustClaim('a', 'b', 1)
      setTrustClaim('a', 'c', 1)
      setTrustClaim('b', 'd', 1)
      setTrustClaim('c', 'd', 1)
      setTrustClaim('d', 'e', 1)
      const trust = p2pTrust.peerConfidence('a', 'e')
      assert.strictEqual(trust.toString(), '1')
    })

    it('should return 0 when there is no connecting path', async function () {
      setTrustClaim('a', 'b', 1)
      setTrustClaim('a', 'c', 1)
      setTrustClaim('b', 'd', 1)
      setTrustClaim('c', 'd', 1)
      setTrustClaim('d', 'e', 1)
      const trust = p2pTrust.peerConfidence('a', 'f')
      assert.strictEqual(trust.toString(), '0')
    })

    it('should handle multiple confidence levels', async function () {
      /*
          a
         / \
        b   c
         \ /
          d
      */
      setTrustClaim('a', 'b', 0.5)
      setTrustClaim('a', 'c', 0.5)
      setTrustClaim('b', 'd', 0.25)
      setTrustClaim('c', 'd', 0.25)
      const trust = p2pTrust.peerConfidence('a', 'd')
      assert.strictEqual(trust.toString(), '0.234375')
    })
  })

  describe('claimConfidence', function () {
    it('should take into account one\'s own claim', async function () {
      /*
        a -> b
      */
      setClaim('a', 'b', 'isCool', 0.7)
      const { confidence, value } = p2pTrust.claimConfidence('a', 'b', 'isCool')
      assert.strictEqual(confidence.toString(), '1')
      assert.strictEqual(value.toString(), '0.7')
    })

    it('should take into account neighbor\'s claim', async function () {
      /*
        a
        |
        b -> c
      */
      setTrustClaim('a', 'b', 0.5)
      setClaim('b', 'c', 'hasSuperpowers', 0.7)
      const { confidence, value } = p2pTrust.claimConfidence('a', 'c', 'hasSuperpowers')
      assert.strictEqual(confidence.toString(), '0.5')
      assert.strictEqual(value.toString(), '0.7')
    })

    it('should take into account multiple paths', async function () {
      /*
          a
         / \
        |   c -/-> d
        b ----/
      */
      setTrustClaim('a', 'b', 0.5)
      setTrustClaim('a', 'c', 0.5)
      setClaim('b', 'd', 'playsTennis', 0.1)
      setClaim('c', 'd', 'playsTennis', 0.1)
      const { confidence, value } = p2pTrust.claimConfidence('a', 'd', 'playsTennis')
      assert.strictEqual(confidence.toString(), '0.75')
      assert.strictEqual(value.toString(), '0.1')
    })

    it('should aggregate varying values', async function () {
      /*
          a
         / \
        |   c -/-> d
        b ----/
      */
      setTrustClaim('a', 'b', 0.5)
      setTrustClaim('a', 'c', 0.75)
      setClaim('b', 'd', 'playsTennis', 0.9)
      setClaim('c', 'd', 'playsTennis', 0.7)
      const { confidence, value } = p2pTrust.claimConfidence('a', 'd', 'playsTennis')
      assert.strictEqual(confidence.toString(), '0.875')
      assert.strictEqual(value.toString(), '0.78')
    })

    it('should handle nonexistent paths', async function () {
      /*
        a
        |
        b
      */
      setTrustClaim('a', 'b', 0.5)
      const { confidence, value } = p2pTrust.claimConfidence('a', 'c', 'hasSuperpowers')
      assert.strictEqual(confidence.toString(), '0')
      assert.strictEqual(value.toString(), '1')
    })
  })
})
