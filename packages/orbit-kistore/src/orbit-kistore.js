class MultiKey {
  constructor (adapter) {
    this.adapter = adapter
    this.key = adapter.createKey()
  }

  getPublic () {
    return `${this.adapter.name}:${this.key.getPublic()}`
  }

  getPrivate () {
    return `${this.adapter.name}:${this.key.getPrivate()}`
  }
}

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
    if (!this.key) {
      this.key = new MultiKey(this.primaryAdapter)
    }
    return this.key
  }

  getKey () {
    return this.createKey()
  }

  importPublicKey (key) {
    const exploded = key.split(':')
    const adapterName = exploded[0]
    const rawKey = exploded[1]
    return this.keyAdapters[adapterName].importPublicKey(rawKey)
  }

  importPrivateKey (key) {
    const exploded = key.split(':')
    const adapterName = exploded[0]
    const rawKey = exploded[1]
    return this.keyAdapters[adapterName].importPrivateKey(rawKey)
  }

  async sign (multiKey, data) {
    const rawSig = await multiKey.adapter.sign(multiKey.key, data)
    return `${multiKey.adapter.name}:${rawSig}`
  }

  // verify from public key as a string
  async verifyFromString (signature, keyString, data) {
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
