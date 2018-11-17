const Ki = require('../src')
const KistoreElliptic = require('../../kistore-elliptic/src/kistore-elliptic')

const kistoreElliptic = new KistoreElliptic()
const keyAdapters = {
  'kistore-elliptic': kistoreElliptic
}
const primaryAdapter = 'kistore-elliptic'

const ki = new Ki({ keyAdapters, primaryAdapter })

window.ki = ki
