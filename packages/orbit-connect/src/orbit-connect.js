const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

function onMessage (topic, data) {
  console.log('message', topic, data)
}

function onNewPeer (topic, peer) {
  console.log('peer', topic, peer)
}

class OrbitConnect {
  constructor ({ nodes, room, orbitdbOptions } = {}) {
    const ipfs = new IPFS(ipfsOptions)
    this.orbitdb = new OrbitDB(ipfs, null, orbitdbOptions)
    this.ipfs = ipfs
    this.connection = this._connectToNodes(nodes, room)
  }

  async _connectToNodes (nodes, room) {
    await new Promise(resolve => this.ipfs.on('ready', resolve))
    await Promise.all(nodes.map(n => {
      return new Promise(resolve => this.ipfs.swarm.connect(n, (err) => {
        if (err) {
          console.error(err)
        }
        resolve()
      }))
    }))
    const ipfsId = await this.ipfs.id()
    this.room = room
    this.pubsub = new Pubsub(this.ipfs, ipfsId.id)
    this.pubsub.subscribe(room, onMessage, onNewPeer)
  }

  async broadcastDb (db) {
    await this.connection
    const address = db.id
    this.pubsub.publish(this.room, { type: 'PIN_DB', address })
  }
}

module.exports = OrbitConnect
