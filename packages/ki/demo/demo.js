const Ki = require('../src/ki')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')
const KiProfile = require('../../ki-profile/src/ki-profile')
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
  const { did, identity } = await getIdentity()
  window.did = did
  window.identity = identity
  console.log('setup complete')
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
  const { identity } = window
  console.log('identity', identity)
  const val = await identity.get(key)
  console.log(val)
}

async function setVal (key, val) {
  const { identity } = window
  console.log('identity', identity)
  console.log('setting')
  const result = await identity.set(key, val)
  console.log(result)
}

async function getAttribute (did, attribute) {
  const { ki, keystore, orbitConnect } = window
  if (!did) {
    did = window.did
  }
  const profile = new KiProfile({ ki, did, keystore, orbitConnect })
  window.profile = profile
  const result = await profile.get(did, attribute)
  console.log(result)
}

async function setAttribute (attribute, value) {
  const { ki, keystore, orbitConnect } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did, keystore, orbitConnect })
  window.profile = profile
  await profile.set(attribute, value)
  console.log('attribute set')
}

async function issueAttestation (subjectId, attribute, value) {
  const { ki, keystore, orbitConnect } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did, keystore, orbitConnect })
  window.profile = profile
  const attestation = await profile.issueAttestation(subjectId, attribute, value)
  console.log(JSON.stringify(attestation))
}

async function addAttestation (attestation) {
  const { ki, keystore, orbitConnect } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did, keystore, orbitConnect })
  window.profile = profile
  await profile.addAttestation(attestation)
  console.log('attestation added')
}

window.getVal = getVal
window.setVal = setVal
window.getAttribute = getAttribute
window.setAttribute = setAttribute
window.issueAttestation = issueAttestation
window.addAttestation = addAttestation
setup()
