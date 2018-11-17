class OrbitKistore {
  constructor (keyAdapters, primaryAdapter) {
    this.keyAdapters = keyAdapters
    this._primaryAdapter = primaryAdapter
  }

  get primaryAdapter () {
    return this.keyAdapters[this._primaryAdapter]
  }

  createKey () {
    this.key = this.primaryAdapter.createKey()
    return this.key
  }

  getKey () {
    return this.key
  }

  importPublicKey (key) {
    return this.primaryAdapter.importPublicKey(key)
  }

  importPrivateKey (key) {
    return this.primaryAdapter.importPrivateKey(key)
  }

  async sign (key, data) {
    const rawSig = await this.primaryAdapter.sign(key, data)
    return `${this.primaryAdapter}:${rawSig}`
  }

  verify (signature, key, data) {
    const exploded = signature.split(':')
    const sigScheme = exploded[0]
    const rawSig = exploded[1]
    return this.keyAdapters[sigScheme].verify(rawSig, key, data)
  }
}

module.exports = OrbitKistore
