const hash = require('object-hash')

const CLAIMS_DB_KEY = 'claims' // the key for the claims db address in the Ki db
const CLAIMS_DB_NAME = 'ki-claims' // the orbit-db name of the claims db

function getToday () {
  const today = new Date()
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
}

class KiClaims {
  constructor ({ ki, did, keystore, orbitConnect, onCreateDb }) {
    this.keystore = keystore
    this.ki = ki
    this.orbitConnect = orbitConnect
    this.did = did
    this.onCreateDb = onCreateDb
  }

  async getClaims (subjectId) {
    const identity = await this.ki.getIdentity(subjectId)
    const claimsDb = await this._getClaimsDb(identity)
    const claims = claimsDb.iterator({ limit: -1 })
      .collect()
      .map((e) => e.payload.value)
    const claimsValidity = await Promise.all(claims.map(c => {
      return this._isValidClaim(c, subjectId)
    }))
    const validClaims = claims.filter((claim, c) => {
      return claimsValidity[c]
    })
    return validClaims
  }

  async addClaim (claim) {
    if (!this.did) {
      throw new Error('KiClaims must be initialized with a did to add claims')
    }
    const _claim = Object.assign({}, claim)
    _claim.id = this._hashClaim(_claim)
    const identity = await this.ki.getIdentity(this.did)
    const claimsDb = await this._getOrCreateClaimsDb(identity)
    await claimsDb.add(_claim)
    return _claim.id
  }

  async issueClaim (subjectId, type, data) {
    if (!this.did) {
      throw new Error('KiClaims must be initialized with a did to issue claims')
    }
    const issued = getToday()
    const claim = {
      type,
      issuer: this.did,
      issued,
      subject: subjectId,
      data
    }
    const hash = this._hashClaim(claim)
    const key = this.keystore.getKey()
    const signature = await this.keystore.sign(key, hash)
    claim.signature = signature
    // the subject identity should add this claim to their account
    return claim
  }

  async _getOrCreateClaimsDb (identity) {
    const existing = await identity.get(CLAIMS_DB_KEY)
    const nameOrAddress = existing || CLAIMS_DB_NAME
    const db = await this.orbitConnect.feed(nameOrAddress)
    if (!existing) {
      await identity.set(CLAIMS_DB_KEY, db.id)
    }
    return db
  }

  async _getClaimsDb (identity) {
    const existing = await identity.get(CLAIMS_DB_KEY)
    if (!existing) {
      throw new Error(`The identity ${identity.did} does not have a claims database`)
    }
    return this.orbitConnect.feed(existing)
  }

  async _isValidClaim (claim, subjectId) {
    if (!this._isChecksumValid(claim)) {
      return false
    }
    if (claim.subject !== subjectId) {
      return false
    }
    const hash = this._hashClaim(claim)
    const signature = claim.signature
    const issuer = claim.issuer
    const issuerIdentity = await this.ki.getIdentity(issuer)
    const issuerKey = issuerIdentity.publicKey
    return this.keystore.verifyFromString(signature, issuerKey, hash)
  }

  _hashClaim (claim) {
    return hash(claim, {
      excludeKeys: (key) => {
        return (key === 'id') || (key === 'signature')
      }
    })
  }

  _isChecksumValid (claim) {
    const hash = this._hashClaim(claim)
    return hash === claim.id
  }
}

module.exports = KiClaims
