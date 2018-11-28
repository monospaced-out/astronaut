const EC = require('elliptic').ec
const ec = new EC('secp256k1')

// copied from https://raw.githubusercontent.com/orbitdb/orbit-db/master/test/utils/custom-test-keystore.js

class KistoreElliptic {
  constructor () {
    this.name = 'elliptic'
  }

  createKey () {
    if (!this.key) {
      const key = ec.genKeyPair()
      this.key = ec.keyPair({
        pub: key.getPublic('hex'),
        priv: key.getPrivate('hex'),
        privEnc: 'hex',
        pubEnc: 'hex'
      })
    }
    return this.key
  }

  getKey () {
    return this.key
  }

  importPublicKey (key) {
    if (!key) {
      this.key = ec.keyFromPublic(key, 'hex')
    }
    return Promise.resolve(this.key)
  }

  async importPrivateKey (key) {
    this.key = await ec.keyFromPrivate(key, 'hex')
    return this.key
  }

  sign (key, data) {
    const sig = ec.sign(data, key)
    return Promise.resolve(sig.toDER('hex'))
  }

  verify (signature, key, data) {
    let res = false
    res = ec.verify(data, signature, key)
    return Promise.resolve(res)
  }
}

module.exports = KistoreElliptic
