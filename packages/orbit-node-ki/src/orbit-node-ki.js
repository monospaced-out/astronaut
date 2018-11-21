require('dotenv').config()

const orbitNode = require('../../orbit-connect-server/src/orbit-connect-server')

const ORBITDB_PATH = process.env['ORBITDB_PATH']
const PINNING_ROOM = 'ki'

orbitNode({ orbitdbPath: ORBITDB_PATH, room: PINNING_ROOM })
