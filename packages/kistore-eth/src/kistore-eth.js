const Web3 = require('web3')

class EthKey {
  constructor (publicKey) {
    this.publicKey = publicKey.toLowerCase()
  }

  getPublic () {
    return this.publicKey
  }

  getPrivate () {
    throw new Error('Cannot access the user\'s ethereum private key')
  }
}

class OrbitDBEthstore {
  constructor (web3Provider) {
    this.name = 'eth'
    this.web3 = new Web3(web3Provider)
  }

  createKey (ethereumAccount) {
    if (!this.key) {
      this.key = new EthKey(ethereumAccount.toLowerCase())
    }
    return this.key
  }

  getKey () {
    return this.key
  }

  generateKey () {
    throw new Error('Cannot generate ethereum key pair')
  }

  exportPublicKey (key) {
    return Promise.resolve(key.getPublic())
  }

  exportPrivateKey (key) {
    return Promise.resolve(key.getPrivate())
  }

  importPublicKey (ethereumAccount) {
    const key = this.createKey(ethereumAccount)
    return Promise.resolve(key)
  }

  importPrivateKey (key) {
    throw new Error('Cannot import ethereum private key')
  }

  sign (key, data) {
    return this.web3.eth.personal.sign(data.toString(), key.getPublic())
  }

  verify (signature, key, data) {
    const recovered = this.web3.eth.accounts.recover(data.toString(), signature)
    return Promise.resolve(recovered.toLowerCase() === key.getPublic())
  }
}

module.exports = OrbitDBEthstore
