const Ki = require('../src/ki')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')
const KistoreEth = require('../../kistore-eth/src/kistore-eth')
const KiProfile = require('../../ki-profile/src/ki-profile')
const Web3 = require('web3')

const localNode = '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5'

async function getAccounts () {
  if (window.ethereum) {
    try {
      // Request account access if needed
      await window.ethereum.enable()
    } catch (error) {
      console.error('denied access')
      // User denied account access...
      return null
    }
  } else if (!window.web3) {
    console.error('Please use a web3-enabled browser')
    return null
  }
  const web3Provider = window.ethereum || window.web3.currentProvider
  const web3 = new Web3(web3Provider)
  const id = await web3.eth.net.getId()
  if (id !== 4) {
    console.error('Please switch to the Rinkeby testnet.')
    return null
  }
  const accounts = await web3.eth.getAccounts()
  if (accounts.length === 0) {
    console.error('Please enable your web3 browser by logging in')
    return null
  }
  return { account: accounts[0], web3Provider }
}

async function setup () {
  const result = await getAccounts()
  let kistoreEth
  if (result) {
    const { account, web3Provider } = result
    kistoreEth = new KistoreEth(web3Provider)
    await kistoreEth.importPublicKey(account)
  } else {
    kistoreEth = new KistoreEth()
  }
  window.kistoreEth = kistoreEth

  const kistoreElliptic = new KistoreElliptic()

  let privateKey = window.localStorage.getItem('privateKey')
  if (!privateKey) {
    privateKey = kistoreElliptic.createKey().getPrivate('hex')
    window.localStorage.setItem('privateKey', privateKey)
  } else {
    await kistoreElliptic.importPrivateKey(privateKey)
  }

  const keyAdapters = [ kistoreEth, kistoreElliptic ]
  const nodes = [ localNode ]

  const ki = new Ki({ keyAdapters, nodes })
  window.ki = ki
  await ki.connection
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
  const { ki } = window
  if (!did) {
    did = window.did
  }
  const profile = new KiProfile({ ki, did })
  window.profile = profile
  const result = await profile.get(did, attribute)
  console.log(result)
}

async function setAttribute (attribute, value) {
  const { ki } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did })
  window.profile = profile
  await profile.set(attribute, value)
  console.log('attribute set')
}

async function issueAttestation (subjectId, attribute, value) {
  const { ki } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did })
  window.profile = profile
  const attestation = await profile.issueAttestation(subjectId, attribute, value)
  console.log(JSON.stringify(attestation))
}

async function addAttestation (attestation) {
  const { ki } = window
  const did = (await getIdentity()).did
  const profile = new KiProfile({ ki, did })
  window.profile = profile
  await profile.addAttestation(attestation)
  console.log('attestation added')
}

async function predictDid (address) {
  const normalizedAddress = address.toLowerCase()
  const did = await window.ki.deriveDid(window.kistoreEth, normalizedAddress)
  console.log(did)
}

window.getVal = getVal
window.setVal = setVal
window.getAttribute = getAttribute
window.setAttribute = setAttribute
window.issueAttestation = issueAttestation
window.addAttestation = addAttestation
window.predictDid = predictDid
setup()
