const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')
const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')

// Inspired by https://github.com/uport-project/3box-pinning-server/blob/master/server.js

const ROOM = 'orbit-connect'

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

let pubsub, orbitdb
let openDBs = {}

async function openDB (address) {
  console.log('Opening db:', address)
  openDBs[address] = await orbitdb.open(address)
}

async function onMessage (topic, data) {
  console.log('Received message:', topic, data)
  if (!data.type || data.type === 'REQUEST_DB') {
    openDB(data.address)
  }
}

async function onNewPeer (topic, peer) {
  console.log('Peer joined room:', topic, peer)
}

async function run ({ orbitdbPath }) {
  // Create IPFS instance
  const ipfs = new IPFS(ipfsOptions)
  ipfs.on('error', (e) => console.error(e))
  await new Promise(resolve => ipfs.on('ready', resolve))
  const ipfsId = await ipfs.id()

  // Set up keystore
  const keyAdapters = [ new KistoreElliptic() ]
  const keystore = new OrbitKistore(keyAdapters)

  orbitdb = new OrbitDB(ipfs, orbitdbPath, { keystore })
  pubsub = new Pubsub(ipfs, ipfsId.id)

  pubsub.subscribe(ROOM, onMessage, onNewPeer)
}

module.exports = run
