const Ki = require('../src/ki')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')
const KiClaims = require('../../ki-claims/src/ki-claims')
const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const OrbitConnect = require('../../orbit-connect-client/src/orbit-connect-client')

const localNode = '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5'

async function setup () {
  const kistoreElliptic = new KistoreElliptic()

  let privateKey = window.localStorage.getItem('privateKey')
  if (!privateKey) {
    privateKey = kistoreElliptic.createKey().getPrivate('hex')
    window.localStorage.setItem('privateKey', privateKey)
  } else {
    await kistoreElliptic.importPrivateKey(privateKey)
  }

  const keyAdapters = [ kistoreElliptic ]
  const nodes = [ localNode ]

  const keystore = new OrbitKistore(keyAdapters)
  const orbitConnect = new OrbitConnect({
    nodes,
    orbitdbOptions: { keystore }
  })

  const ki = new Ki({ orbitConnect, keystore })
  window.ki = ki
  window.keystore = keystore
  window.orbitConnect = orbitConnect
}

async function getIdentity () {
  let did = window.localStorage.getItem('did')
  let identity
  if (!did) {
    identity = await window.ki.createIdentity()
    did = identity.did
    window.localStorage.setItem('did', did)
  } else {
    identity = await window.ki.getIdentity(did)
  }
  window.identity = identity
  return { did, identity }
}

async function getVal (key) {
  const { identity } = await getIdentity()
  console.log('identity', identity)
  const val = await identity.get(key)
  console.log(val)
}

async function setVal (key, val) {
  const { identity } = await getIdentity()
  console.log('identity', identity)
  console.log('setting')
  const result = await identity.set(key, val)
  console.log(result)
}

async function start () {
  const { ki, keystore, orbitConnect } = window
  const { did, identity } = await getIdentity()
  console.log(did, identity)
  const kiClaims = new KiClaims({ ki, did, keystore, orbitConnect })
  window.kiClaims = kiClaims
  const claim = await kiClaims.issueClaim(did, 'SpiritAnimal', 'bobwhite')
  console.log(claim)
  await kiClaims.addClaim(claim)
  const claims = await kiClaims.getClaims(did)
  console.log(claims)
}

window.getVal = getVal
window.setVal = setVal
window.start = start
setup()
