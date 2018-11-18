const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')

let pubsub

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

function onMessage(topic, data) {
  console.log('message', topic, data)
}

function onNewPeer(topic, peer) {
  console.log('peer', topic, peer)
}

async function connectToNodes(ipfs, orbitdb, nodes, room) {
  await new Promise(resolve => ipfs.on('ready', resolve))
  await Promise.all(nodes.map(n => {
    return new Promise(resolve => ipfs.swarm.connect(n, (err) => {
      if (err) {
        console.error(err)
      }
      resolve()
    }))
  }))
  const ipfsId = await ipfs.id()
  pubsub = new Pubsub(ipfs, ipfsId.id)
  pubsub.subscribe(room, onMessage, onNewPeer)
}

function orbitConnect({ orbitdbDirectory, orbitdbKeystore, nodes = [], room } = {}) {
  const ipfs = new IPFS(ipfsOptions)
  const orbitdb = new OrbitDB(ipfs, orbitdbDirectory, { keystore: orbitdbKeystore })
  connectToNodes(ipfs, orbitdb, nodes, room)
  const publish = (address) => {
    pubsub.publish(room, { type: 'PIN_DB', address })
  }
  return { orbitdb, ipfs, publish }
}

module.exports = orbitConnect
