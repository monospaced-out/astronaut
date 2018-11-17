// Inspired by https://github.com/uport-project/3box-pinning-server/blob/master/server.js

require('dotenv').config()
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const Pubsub = require('orbit-db-pubsub')

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
}
const ORBITDB_PATH = process.env['ORBITDB_PATH']
const PINNING_ROOM = 'ki'

let pubsub, orbitdb
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
      (odbAddress, entryHash, entry, num, max) => {
        console.log('Replicating entry:', entryHash)
        console.log('On db:', odbAddress)
        if (num === max) {
          openDBs[address].events.on('replicated', () => {
            console.log('Fully replicated db:', odbAddress)
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

function publish (type, odbAddress, data) {
  let dataObj = { type, odbAddress }
  if (type === 'HAS_ENTRIES') {
    dataObj.numEntries = data
  } else if (type === 'REPLICATED') {
  }
  pubsub.publish(PINNING_ROOM, dataObj)
}

async function onMessage (topic, data) {
  console.log(topic, data)
  if (!data.type || data.type === 'PIN_DB') {
    openDB(data.odbAddress)
  }
}

async function onNewPeer (topic, peer) {
  console.log('peer joined room', topic, peer)
}

async function run () {
  // Create IPFS instance
  const ipfs = new IPFS(ipfsOptions)

  ipfs.on('error', (e) => console.error(e))

  await new Promise(resolve => ipfs.on('ready', resolve))

  const ipfsId = await ipfs.id()
  console.log(ipfsId)
  orbitdb = new OrbitDB(ipfs, ORBITDB_PATH)
  pubsub = new Pubsub(ipfs, ipfsId.id)

  pubsub.subscribe(PINNING_ROOM, onMessage, onNewPeer)
}

run()
