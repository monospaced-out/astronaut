/* globals describe, it */

const P2PTrust = require('../src/p2p-trust')
const assert = require('assert')

describe('jacobs algorithm', function () {
  describe('peerTrust', function () {
    it('should retrieve trust for a neighbor', async function () {
      /*
        a
        |
        b
      */
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      const trust = p2pTrust.peerTrust('a', 'b')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setTrustClaim('b', 'c', 0.5)
      const trust = p2pTrust.peerTrust('a', 'c')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setTrustClaim('a', 'c', 0.5)
      p2pTrust.setTrustClaim('b', 'd', 0.5)
      p2pTrust.setTrustClaim('c', 'd', 0.5)
      const trust = p2pTrust.peerTrust('a', 'd')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 1)
      p2pTrust.setTrustClaim('a', 'c', 1)
      p2pTrust.setTrustClaim('b', 'd', 1)
      p2pTrust.setTrustClaim('c', 'd', 1)
      p2pTrust.setTrustClaim('d', 'e', 1)
      const trust = p2pTrust.peerTrust('a', 'e')
      assert.strictEqual(trust.toString(), '1')
    })

    it('should return 0 when there is no connecting path', async function () {
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 1)
      p2pTrust.setTrustClaim('a', 'c', 1)
      p2pTrust.setTrustClaim('b', 'd', 1)
      p2pTrust.setTrustClaim('c', 'd', 1)
      p2pTrust.setTrustClaim('d', 'e', 1)
      const trust = p2pTrust.peerTrust('a', 'f')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setTrustClaim('a', 'c', 0.5)
      p2pTrust.setTrustClaim('b', 'd', 0.25)
      p2pTrust.setTrustClaim('c', 'd', 0.25)
      const trust = p2pTrust.peerTrust('a', 'd')
      assert.strictEqual(trust.toString(), '0.234375')
    })
  })

  describe('claimTrust', function () {
    it('should take into account one\'s own claim', async function () {
      /*
        a -> b
      */
      const p2pTrust = new P2PTrust()
      p2pTrust.setClaim('a', 'b', 'isCool', 0.7)
      const { confidence, value } = p2pTrust.claimTrust('a', 'b', 'isCool')
      assert.strictEqual(confidence.toString(), '1')
      assert.strictEqual(value.toString(), '0.7')
    })

    it('should take into account neighbor\'s claim', async function () {
      /*
        a
        |
        b -> c
      */
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setClaim('b', 'c', 'hasSuperpowers', 0.7)
      const { confidence, value } = p2pTrust.claimTrust('a', 'c', 'hasSuperpowers')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setTrustClaim('a', 'c', 0.5)
      p2pTrust.setClaim('b', 'd', 'playsTennis', 0.1)
      p2pTrust.setClaim('c', 'd', 'playsTennis', 0.1)
      const { confidence, value } = p2pTrust.claimTrust('a', 'd', 'playsTennis')
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
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      p2pTrust.setTrustClaim('a', 'c', 0.75)
      p2pTrust.setClaim('b', 'd', 'playsTennis', 0.9)
      p2pTrust.setClaim('c', 'd', 'playsTennis', 0.7)
      const { confidence, value } = p2pTrust.claimTrust('a', 'd', 'playsTennis')
      assert.strictEqual(confidence.toString(), '0.875')
      assert.strictEqual(value.toString(), '0.78')
    })

    it('should handle nonexistent paths', async function () {
      /*
        a
        |
        b
      */
      const p2pTrust = new P2PTrust()
      p2pTrust.setTrustClaim('a', 'b', 0.5)
      const { confidence, value } = p2pTrust.claimTrust('a', 'c', 'hasSuperpowers')
      assert.strictEqual(confidence.toString(), '0')
      assert.strictEqual(value.toString(), '1')
    })
  })
})
