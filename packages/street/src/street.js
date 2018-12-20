const Big = require('big.js')
const P2PTrust = require('../../p2p-trust/src/p2p-trust')
const jacobsMetric = require('../../jacobs-metric/src/jacobs-metric')

const CRED_CLAIM = 'cred'
const TRUST_CLAIM = 'trust'
const ZERO = new Big(0)
const ONE = new Big(1)

function addNode (nodes, node) {
  if (!nodes.includes(node)) {
    nodes.push(node)
  }
}

class Street {
  constructor ({ limit, defaultConfidence, iterations = 10, dp = 5 }) {
    this.limit = limit
    this.trustClaims = {}
    this.ratingClaims = {}
    this.defaultConfidence = defaultConfidence
    this.nodes = []
    this.iterations = iterations
    this.dp = dp
  }

  setTrust (from, to, confidence) {
    const trustClaims = Object.assign({}, this.trustClaims[from])
    confidence = confidence || this.defaultConfidence
    trustClaims[to] = { confidence }
    this.trustClaims[from] = trustClaims
    addNode(this.nodes, from)
    addNode(this.nodes, to)
    this.p2pTrust = null
  }

  removeTrust (from, to) {
    const trustClaims = Object.assign({}, this.trustClaims[from])
    delete trustClaims[to]
    this.trustClaims[from] = trustClaims
    this.p2pTrust = null
  }

  addCred (from, to, time, isNegative = false) {
    const ratingClaims = Object.assign({}, this.ratingClaims[from])
    const list = ratingClaims[to] ? ratingClaims[to].slice(0) : []
    list.push({ time: new Big(time), isNegative })
    ratingClaims[to] = list
    this.ratingClaims[from] = ratingClaims
    addNode(this.nodes, from)
    addNode(this.nodes, to)
    this.p2pTrust = null
  }

  removeCred (from, to, time) {
    this.p2pTrust = null
    return this.addCred(from, to, time, true)
  }

  cred (from, to, startTime, currentTime) {
    startTime = new Big(startTime)
    currentTime = new Big(currentTime)
    const claimsCache = {}
    claimsCache[TRUST_CLAIM] = {}
    claimsCache[CRED_CLAIM] = {}

    const getClaims = (from, claimType) => {
      if (claimsCache[claimType][from]) {
        return claimsCache[claimType][from]
      }
      if (claimType === TRUST_CLAIM) {
        const trustClaims = this.trustClaims[from]
        if (!trustClaims) {
          claimsCache[claimType][from] = []
          return claimsCache[claimType][from]
        }
        claimsCache[claimType][from] = Object.keys(trustClaims).map(t => {
          const claim = trustClaims[t]
          if (!claim) {
            return
          }
          const { confidence } = claim
          return { value: null, confidence, to: t }
        }).filter(c => c)
        return claimsCache[claimType][from]
      } else if (claimType === CRED_CLAIM) {
        const ratingClaims = this.ratingClaims[from]
        if (!ratingClaims) {
          claimsCache[claimType][from] = []
          return claimsCache[claimType][from]
        }
        claimsCache[claimType][from] = Object.keys(ratingClaims).map(t => {
          const list = ratingClaims[t]
          if (!list) {
            return
          }
          const timeDelta = currentTime.minus(startTime)
          const validatedList = list.filter(({ time }) => {
            return (time.gt(startTime)) && (time.lte(currentTime))
          })
          const votes = new Big(validatedList.length)
          if (votes.toString() === '0') {
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
            value: cumulativeRating
          }
          return { value, confidence: 1, to: t }
        }).filter(c => c)
        return claimsCache[claimType][from]
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

    const p2pTrust = this.p2pTrust || new P2PTrust({
      getClaims,
      getValue,
      metric: jacobsMetric,
      useCache: true,
      iterations: this.iterations,
      dp: this.dp,
      nodes: this.nodes
    })
    this.p2pTrust = p2pTrust
    const { confidence, value: { votes, value } } = p2pTrust.claimConfidence(from, to, CRED_CLAIM)
    return { confidence, votes, value }
  }
}

module.exports = Street
