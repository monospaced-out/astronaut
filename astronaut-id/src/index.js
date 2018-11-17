const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const DB_NAME = 'astronaut'

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

class Austronaut {
  constructor() {
    this.ipfs = new IPFS(ipfsOptions)
    this.orbitdb = new OrbitDB(this.ipfs)
  }

  async createId() {
    const db = await this.orbitdb.keyvalue(DB_NAME)
    return this.addressToId(db.address.root)
  }

  addressToId(address) {
    return `did:astro:${address}`
  }
}

module.exports = Austronaut
