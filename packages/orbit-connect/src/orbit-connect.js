const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')

const SYNC_TIMEOUT = 5000
const ROOM = 'orbit-connect'

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

function onMessage (topic, data) {
  // console.log('message', topic, data)
}

function onNewPeer (topic, peer) {
  console.log('peer', topic, peer)
}

class OrbitConnect {
  constructor ({ nodes, orbitdbOptions, syncTimeout = SYNC_TIMEOUT, waitNodes } = {}) {
    const ipfs = new IPFS(ipfsOptions)
    this.orbitdb = new OrbitDB(ipfs, null, orbitdbOptions)
    this.ipfs = ipfs
    this.nodes = nodes
    this.peers = this.nodes.map(n => n.split('/').slice(-1)[0]) // address is last part of url
    this.waitNodes = waitNodes || nodes.length // how many nodes to sync with before resolving a query
    this.syncedPeers = {}
    this.connection = this._connectToNodes(nodes)
    this.syncTimeout = syncTimeout // how long to wait for a node to sync data
  }

  async open (address, options) {
    const db = await this.orbitdb.open(address, options)
    await this._syncDb(db)
    return db
  }

  async feed (address, options) {
    const db = await this.orbitdb.feed(...arguments)
    await this._syncDb(db)
    return db
  }

  async log (address, options) {
    const db = await this.orbitdb.log(...arguments)
    await this._syncDb(db)
    return db
  }

  async eventlog (address, options) {
    const db = await this.orbitdb.eventlog(...arguments)
    await this._syncDb(db)
    return db
  }

  async keyvalue (address, options) {
    const db = await this.orbitdb.keyvalue(...arguments)
    await this._syncDb(db)
    return db
  }

  async kvstore (address, options) {
    const db = await this.orbitdb.kvstore(...arguments)
    await this._syncDb(db)
    return db
  }

  async counter (address, options) {
    const db = await this.orbitdb.counter(...arguments)
    await this._syncDb(db)
    return db
  }

  async docs (address, options) {
    const db = await this.orbitdb.docs(...arguments)
    await this._syncDb(db)
    return db
  }

  async docstore (address, options) {
    const db = await this.orbitdb.docstore(...arguments)
    await this._syncDb(db)
    return db
  }

  async _connectToNodes (nodes) {
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
    this.pubsub = new Pubsub(this.ipfs, ipfsId.id)
    this.pubsub.subscribe(ROOM, onMessage, onNewPeer)
  }

  async _syncDb (db) {
    this.syncedPeers[db.id] = this.syncedPeers[db.id] || []
    const syncedPeers = this.syncedPeers[db.id]

    await new Promise(resolve => {
      const resolveWhenSynced = () => {
        if (syncedPeers.length === this.waitNodes) {
          resolve()
        }
      }
      const updatePeers = (peer) => {
        if (this.peers.includes(peer) && !syncedPeers.includes(peer)) {
          syncedPeers.push(peer)
          // check if peers are now synced
          resolveWhenSynced()
        }
      }

      // check if peers are already synced
      resolveWhenSynced()

      // listen for `synced` events
      db.events.on('synced', (address, heads, peer) => {
        updatePeers(peer)
      })

      // request database from peers; should trigger `synced` events, once for each peer per session
      this._requestDb(db)

      // Timeout to avoid waiting indefinitely if peers do not respond
      setTimeout(resolve, this.syncTimeout)
    })

    await db.load()
  }

  // requests that peers send over any data for given db
  async _requestDb (db) {
    await this.connection
    const address = db.id
    this.pubsub.publish(ROOM, { type: 'REQUEST_DB', address })
  }
}

module.exports = OrbitConnect
