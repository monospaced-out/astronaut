const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')
const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')

// Inspired by https://github.com/uport-project/3box-pinning-server/blob/master/server.js

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}

let pubsub, orbitdb, pinningRoom
let openDBs = {}

async function openDB (address) {
  if (!openDBs[address]) {
    console.log('Opening db:', address)
    openDBs[address] = await orbitdb.open(address)
    openDBs[address].events.on('ready', () => {
      sendResponse(address)
    })
    openDBs[address].load()
    openDBs[address].events.on(
      'replicate.progress',
      (address, entryHash, entry, num, max) => {
        console.log('Replicating entry:', entryHash)
        console.log('On db:', address)
        if (num === max) {
          openDBs[address].events.on('replicated', () => {
            console.log('Fully replicated db:', address)
            publish('REPLICATED', address)
          })
        }
      }
    )
  } else {
    sendResponse(address)
  }
}

function sendResponse (address) {
  const numEntries = openDBs[address]._oplog._length
  publish('HAS_ENTRIES', address, numEntries)
}

function publish (type, address, data) {
  let dataObj = { type, address }
  if (type === 'HAS_ENTRIES') {
    dataObj.numEntries = data
  } else if (type === 'REPLICATED') {
  }
  pubsub.publish(pinningRoom, dataObj)
}

async function onMessage (topic, data) {
  console.log(topic, data)
  if (!data.type || data.type === 'PIN_DB') {
    openDB(data.address)
  }
}

async function onNewPeer (topic, peer) {
  console.log('peer joined room', topic, peer)
}

async function run ({ orbitdbPath, room }) {
  // Create IPFS instance
  const ipfs = new IPFS(ipfsOptions)
  pinningRoom = room

  ipfs.on('error', (e) => console.error(e))

  await new Promise(resolve => ipfs.on('ready', resolve))

  const ipfsId = await ipfs.id()
  console.log(ipfsId)

  // Set up keystore
  const keyAdapters = [ new KistoreElliptic() ]
  const keystore = new OrbitKistore(keyAdapters)

  orbitdb = new OrbitDB(ipfs, orbitdbPath, { keystore })
  pubsub = new Pubsub(ipfs, ipfsId.id)

  pubsub.subscribe(room, onMessage, onNewPeer)
}

module.exports = run
