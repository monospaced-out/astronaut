const orbitConnect = require('../../orbit-connect/src/orbit-connect')
const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')

const DB_NAME = 'ki'
const PINNING_ROOM = 'ki'

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
    const { orbitdb, publish } = orbitConnect({
      nodes,
      room: PINNING_ROOM,
      orbitdbKeystore: keystore
    })
    this.orbitdb = orbitdb
    this.publish = publish
  }

  async createIdentity () {
    const db = await this.orbitdb.keyvalue(DB_NAME)
    this.publish(db.address.root)
    return new Identity(db)
  }

  async getIdentity (id) {
    const address = didToAddress(id)
    const db = await this.orbitdb.keyvalue(`/orbitdb/${address}/${DB_NAME}`)
    return new Identity(db)
  }
}

module.exports = Ki
