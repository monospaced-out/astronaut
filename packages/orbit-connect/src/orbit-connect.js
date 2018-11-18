const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')

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

async function connectToNodes(ipfs, nodes, room) {
  await new Promise(resolve => ipfs.on('ready', resolve))
  await Promise.all(nodes.map(n => {
    return new Promise(resolve => ipfs.swarm.connect(n, resolve))
  }))
  const ipfsId = await ipfs.id()
  const pubsub = new Pubsub(ipfs, ipfsId.id)
  pubsub.subscribe(room, onMessage, onNewPeer)
}

function orbitConnect({ orbitdbDirectory, orbitdbKeystore, nodes = [], room } = {}) {
  const ipfs = new IPFS(ipfsOptions)
  const orbitdb = new OrbitDB(ipfs, orbitdbDirectory, { keystore: orbitdbKeystore })
  connectToNodes(ipfs, nodes, room)
  return { orbitdb, ipfs }
}

module.exports = orbitConnect
