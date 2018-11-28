const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const OrbitConnect = require('../../orbit-connect-client/src/orbit-connect-client')

const DB_NAME = 'ki'

function didToAddress (id) {
  const exploded = id.split(':')
  if (exploded.length !== 3) {
    throw new Error('invalid id')
  }
  return exploded[2]
}

function addressToDid (address) {
  return `did:ki:${address}`
}

class Identity {
  constructor (db) {
    this.db = db
  }

  get did () {
    return addressToDid(this.db.address.root)
  }

  get publicKey () {
    return this.db.access.write[0]
  }

  set (key, value) {
    return this.db.set(key, value)
  }

  get (key) {
    return this.db.get(key)
  }
}

class Ki {
  constructor ({ keyAdapters, nodes } = {}) {
    const keystore = new OrbitKistore(keyAdapters)
    const orbitConnect = new OrbitConnect({
      nodes,
      orbitdbOptions: { keystore }
    })
    this.orbitConnect = orbitConnect
    this.keystore = keystore
    this.connection = orbitConnect.connection
  }

  async createIdentity () {
    const db = await this.orbitConnect.keyvalue(DB_NAME)
    return new Identity(db)
  }

  async getIdentity (did) {
    const address = didToAddress(did)
    const db = await this.orbitConnect.open(`/orbitdb/${address}/${DB_NAME}`)
    return new Identity(db)
  }

  async deriveDid (keyAdapter, publicKey) {
    const orbitdb = this.orbitConnect.orbitdb
    const keyStr = `${keyAdapter.name}:${publicKey}`
    const address = await orbitdb.determineAddress(
      DB_NAME,
      'keyvalue',
      { write: [keyStr] }
    )
    return `did:ki:${address.root}`
  }
}

module.exports = Ki
