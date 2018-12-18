const Big = require('big.js')
const P2PTrust = require('../../p2p-trust/src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')

const CRED_CLAIM = 'cred'
const TRUST_CLAIM = 'trust'
const ZERO = new Big(0)
const ONE = new Big(1)

class Street {
  constructor ({ limit, defaultConfidence, startTime }) {
    this.limit = limit
    this.trustClaims = {}
    this.ratingClaims = {}
    this.defaultConfidence = defaultConfidence
    this.startTime = new Big(startTime)
  }

  setTrust (from, to, confidence) {
    const trustClaims = Object.assign({}, this.trustClaims[from])
    confidence = confidence || this.defaultConfidence
    trustClaims[to] = { confidence }
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
    list.push({ time: new Big(time), isNegative })
    ratingClaims[to] = list
    this.ratingClaims[from] = ratingClaims
  }

  removeCred (from, to, time) {
    return this.addCred(from, to, time, true)
  }

  cred (from, to, currentTime) {
    currentTime = new Big(currentTime)

    const getClaims = (from, claimType) => {
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
          const { confidence } = claim
          return { value: null, confidence, to: t }
        }).filter(c => c)
      } else if (claimType === CRED_CLAIM) {
        const ratingClaims = this.ratingClaims[from]
        if (!ratingClaims) {
          return []
        }
        return Object.keys(ratingClaims).map(t => {
          const list = ratingClaims[t]
          if (!list) {
            return
          }
          const { startTime } = this
          const timeDelta = currentTime.minus(startTime)
          const validatedList = list.filter(({ time }) => {
            return (time.gt(startTime)) && (time.lte(currentTime))
          })
          const votes = new Big(validatedList.length)
          if (!votes) {
            return
          }
          if ((votes.div(timeDelta)).gt(this.limit)) {
            return
          }
          const cumulativeRating = validatedList.reduce((acc, { isNegative }) => {
            return isNegative ? acc.minus(ONE) : acc.plus(ONE)
          }, ZERO)
          const value = {
            votes,
            value: new Big(cumulativeRating)
          }
          return { value, confidence: 1, to: t }
        }).filter(c => c)
      } else {
        return []
      }
    }

    const getValue = (claims) => {
      claims = claims.filter(c => c.value)

      // calculate mean value
      const weights = claims.map(({ confidence, value: { votes } }) => {
        return confidence.times(votes)
      })
      const valueWeightedSum = claims.reduce((acc, { confidence, value: { value, votes } }, i) => {
        return acc.plus(weights[i].times(value))
      }, ZERO)
      const weightSum = weights.reduce((acc, weight) => {
        return acc.plus(weight)
      }, ZERO)
      const meanWeightedValue = weightSum.eq(ZERO)
        ? ZERO
        : valueWeightedSum.div(weightSum)

      // calculate mean votes
      const confidenceSum = claims.reduce((acc, { confidence }) => {
        return acc.plus(confidence)
      }, ZERO)
      const votesWeightedSum = claims.reduce((acc, { confidence, value: { votes } }) => {
        return acc.plus(confidence.times(votes))
      }, ZERO)
      const meanWeightedVotes = votesWeightedSum.eq(ZERO)
        ? ZERO
        : votesWeightedSum.div(confidenceSum)

      return {
        value: meanWeightedValue,
        votes: meanWeightedVotes
      }
    }

    const p2pTrust = new P2PTrust({ getClaims, getValue, metric: jacobsMetric })
    const { confidence, value: { votes, value } } = p2pTrust.claimConfidence(from, to, CRED_CLAIM)
    return { confidence, votes, value }
  }
}

module.exports = Street
