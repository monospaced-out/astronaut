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

module.exports = EthKey
