class OrbitKistore {
  constructor (keyAdapters) {
    const hash = {}
    keyAdapters.forEach(a => {
      hash[a.name] = a
    })
    this.keyAdapters = hash
    this._primaryAdapter = keyAdapters[0].name
  }

  get primaryAdapter () {
    return this.keyAdapters[this._primaryAdapter]
  }

  createKey () {
    this.key = this.primaryAdapter.createKey()
    return this.key
  }

  getKey () {
    return this.primaryAdapter.getKey()
  }

  importPublicKey (key) {
    return this.primaryAdapter.importPublicKey(key)
  }

  importPrivateKey (key) {
    return this.primaryAdapter.importPrivateKey(key)
  }

  async sign (key, data) {
    const rawSig = await this.primaryAdapter.sign(key, data)
    return `${this.primaryAdapter.name}:${rawSig}`
  }

  // verify from public key as a string
  async verifyFromString(signature, keyString, data) {
    const exploded = signature.split(':')
    const adapterName = exploded[0]
    const key = await this.keyAdapters[adapterName].importPublicKey(keyString)
    return this.verify(signature, key, data)
  }

  verify (signature, key, data) {
    const exploded = signature.split(':')
    const adapterName = exploded[0]
    const rawSig = exploded[1]
    return this.keyAdapters[adapterName].verify(rawSig, key, data)
  }
}

module.exports = OrbitKistore
