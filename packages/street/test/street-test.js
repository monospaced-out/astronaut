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
        getTime: clock.time.bind(clock),
        defaultConfidence: 0.5
      })
      street.setTrust('a', 'b', clock.time())
      clock.tick()
      street.addCred('b', 'c', clock.time())
      const { confidence, value } = street.cred('a', 'c')
      assert.strictEqual(confidence.toString(), '0.5')
      assert.strictEqual(value.toString(), '1')
    })
  })
})
