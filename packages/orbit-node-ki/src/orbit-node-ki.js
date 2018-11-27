require('dotenv').config()

const OrbitKistore = require('../../orbit-kistore/src/orbit-kistore')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')
const KistoreEth = require('../../kistore-eth/src/kistore-eth')
const orbitNode = require('../../orbit-connect-server/src/orbit-connect-server')

const ORBITDB_PATH = process.env['ORBITDB_PATH']

// Set up keystore
const keyAdapters = [
  new KistoreElliptic(),
  new KistoreEth(process.env['WEB3_PROVIDER'])
]
const keystore = new OrbitKistore(keyAdapters)

orbitNode({ orbitdbPath: ORBITDB_PATH, keystore })
