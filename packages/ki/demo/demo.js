const Ki = require('../src/ki')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')

const localNode = '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5'

const keyAdapters = [
  new KistoreElliptic()
]
const nodes = [ localNode ]

const ki = new Ki({ keyAdapters, nodes })

window.ki = ki
