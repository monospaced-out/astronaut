const P2PTrust = require('../../p2p-trust/src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')

const RATING_CLAIM = 'rating'
const TRUST_CLAIM = 'trust'

class Street {
  constructor ({ limit, getTime, defaultConfidence }) {
    this.limit = limit
    this.getTime = getTime || (() => { new Date().getTime() })
    this.trustClaims = {}
    this.ratingClaims = {}
    this.defaultConfidence = defaultConfidence
  }

  setTrust (from, to, time, confidence) {
    const trustClaims = Object.assign({}, this.trustClaims[from])
    confidence = confidence || this.defaultConfidence
    trustClaims[to] = { confidence, time }
    this.trustClaims[from] = trustClaims
  }

  removeTrust (from, to) {
    const trustClaims = Object.assign({}, this.trustClaims[from])
    delete trustClaims[to]
    this.trustClaims[from] = trustClaims
  }

  addCred (from, to, time, isNegative = false) {
    const ratingClaims = Object.assign({}, this.ratingClaims[from])
    const list = ratingClaims[to] ? ratingClaims[to].slice(0) : []
    list.push({ time, isNegative })
    ratingClaims[to] = list
    this.ratingClaims[from] = ratingClaims
  }

  removeCred (from, to, time) {
    return this.addCred(from, to, time, true)
  }

  cred (from, to) {
    const currentTime = this.getTime()
    const getClaims = (caller, from, claimType) => {
      if (claimType === TRUST_CLAIM) {
        const trustClaims = this.trustClaims[from]
        if (!trustClaims) {
          return []
        }
        return Object.keys(trustClaims).map(t => {
          const claim = trustClaims[t]
          if (!claim) {
            return
          }
          const { confidence, time } = claim
          if (time <= currentTime) {
            return { value: 1, confidence, to: t }
          }
        }).filter(c => c)
      } else if (claimType === RATING_CLAIM) {
        const ratingClaims = this.ratingClaims[from]
        if (!ratingClaims) {
          return []
        }
        return Object.keys(ratingClaims).map(t => {
          const list = ratingClaims[t]
          if (!list) {
            return
          }
          const tc = this.trustClaims
          const startTime = tc[caller] && tc[caller][from] && tc[caller][from].time
          if (typeof startTime !== 'number') {
            return
          }
          const timeDelta = currentTime - startTime
          const validatedList = list.filter(({ time }) => {
            return (time > startTime) && (time <= currentTime)
          })
          if (!validatedList.length) {
            return
          }
          if ((timeDelta / validatedList.length) > this.limit) {
            return
          }
          const cumulativeRating = validatedList.reduce((acc, { isNegative }) => {
            return isNegative ? acc - 1 : acc + 1
          }, 0)
          return { value: cumulativeRating, confidence: 1, to: t }
        }).filter(c => c)
      } else {
        return []
      }
    }
    const p2pTrust = new P2PTrust({ getClaims, metric: jacobsMetric })
    return p2pTrust.claimConfidence(from, to, RATING_CLAIM)
  }
}

module.exports = Street
