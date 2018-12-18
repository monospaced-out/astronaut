/* globals describe, it */

const Street = require('../src/street')
const assert = require('assert')

class Clock {
  constructor () {
    this.state = 0
  }

  tick () {
    this.state++
  }

  time () {
    return this.state
  }
}

describe('street', function () {
  describe('cred', function () {
    it('should handle single cred', async function () {
      const clock = new Clock()
      const street = new Street({
        limit: 1,
        defaultConfidence: 0.5
      })
      street.setTrust('a', 'b', clock.time())
      clock.tick()
      street.addCred('b', 'c', clock.time())
      const { confidence, value: { votes, value } } = street.cred('a', 'c', clock.time())
      assert.strictEqual(confidence.toString(), '0.5')
      assert.strictEqual(votes.toString(), '1')
      assert.strictEqual(value.toString(), '1')
    })

    it('should handle self-issued cred', async function () {
      const clock = new Clock()
      const street = new Street({
        limit: 1,
        defaultConfidence: 0.5
      })
      clock.tick()
      street.addCred('a', 'b', clock.time())
      const { confidence, value: { votes, value } } = street.cred('a', 'b', clock.time())
      assert.strictEqual(confidence.toString(), '1')
      assert.strictEqual(votes.toString(), '1')
      assert.strictEqual(value.toString(), '1')
    })

    it('should handle complex cred', async function () {
      const clock = new Clock()
      const street = new Street({
        limit: 1,
        defaultConfidence: 0.5
      })
      street.setTrust('a', 'b', clock.time())
      street.setTrust('a', 'c', clock.time())
      street.setTrust('b', 'd', clock.time())
      street.setTrust('c', 'd', clock.time())
      clock.tick()
      street.addCred('b', 'e', clock.time())
      street.addCred('d', 'e', clock.time())
      clock.tick()
      street.addCred('d', 'e', clock.time())
      const { confidence, value: { votes, value } } = street.cred('a', 'e', clock.time())
      assert.strictEqual(confidence.toString(), '0.625')
      assert.strictEqual(votes.toString(), '1.55555555555555555555')
      assert.strictEqual(value.toString(), '1.71428571428571428571')
    })

    it('should only use cred issued after a peer has been trusted', async function () {
      const clock = new Clock()
      const street = new Street({
        limit: 1,
        defaultConfidence: 0.5
      })
      street.addCred('b', 'c', clock.time()) // this one should be ignored
      clock.tick()
      street.setTrust('a', 'b', clock.time())
      clock.tick()
      street.addCred('b', 'c', clock.time())
      clock.tick()
      street.addCred('b', 'c', clock.time())
      const { confidence, value: { votes, value } } = street.cred('a', 'c', clock.time())
      assert.strictEqual(confidence.toString(), '0.5')
      assert.strictEqual(votes.toString(), '2')
      assert.strictEqual(value.toString(), '2')
    })
  })
})
