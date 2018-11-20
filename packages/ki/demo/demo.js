const Ki = require('../src/ki')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')
const KiClaims = require('../../ki-claims/src/ki-claims')
const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const OrbitConnect = require('../../orbit-connect/src/orbit-connect')

const localNode = '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5'
const PINNING_ROOM = 'ki'

const kistoreElliptic = new KistoreElliptic()

let privateKey = window.localStorage.getItem('privateKey')
if (!privateKey) {
  privateKey = kistoreElliptic.createKey().getPrivate('hex')
  window.localStorage.setItem('privateKey', privateKey)
} else {
  kistoreElliptic.importPrivateKey(privateKey)
}

const keyAdapters = [ kistoreElliptic ]
const nodes = [ localNode ]

const keystore = new OrbitKistore(keyAdapters)
const orbitConnect = new OrbitConnect({
  nodes,
  room: PINNING_ROOM,
  orbitdbOptions: { keystore }
})
const { orbitdb, broadcastDb } = orbitConnect
const onCreateDb = broadcastDb.bind(orbitConnect)

const ki = new Ki({ orbitdb, onCreateDb, keystore })
window.ki = ki

async function start () {
  let did = window.localStorage.getItem('did')
  let identity
  if (!did) {
    identity = await ki.createIdentity()
    did = identity.did
    window.localStorage.setItem('did', did)
  } else {
    identity = await ki.getIdentity(did)
  }
  console.log(did, identity)
  const kiClaims = new KiClaims({ ki, did, keystore, orbitdb, onCreateDb })
  window.kiClaims = kiClaims
  const claim = await kiClaims.issueClaim(did, 'SpiritAnimal', 'bobwhite')
  console.log(claim)
  await kiClaims.addClaim(claim)
  const claims = await kiClaims.getClaims(did)
  console.log(claims)
}

window.start = start
