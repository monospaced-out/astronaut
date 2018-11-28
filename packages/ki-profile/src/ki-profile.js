const KiClaims = require('../../ki-claims/src/ki-claims')

const PROFILE_DB_KEY = 'profile' // the key for the claims db address in the Ki db
const PROFILE_DB_NAME = 'ki-profile' // the orbit-db name of the claims db
const ATTESTATION_TYPE = 'profile-attestation'

class KiProfile {
  constructor ({ ki, did, keystore, orbitConnect }) {
    this.ki = ki
    this.keystore = ki.keystore
    this.orbitConnect = ki.orbitConnect
    this.did = did
    this.kiClaims = new KiClaims({ ki, did, keystore, orbitConnect })
    this.dbCache = {}
    this.identityCache = {}
  }

  async get (subjectId, attribute) {
    const claims = await this.kiClaims.getClaims(subjectId)
    const identity = await this._getIdentity(subjectId)
    const profile = await this._getProfileDb(identity)
    if (!profile) {
      return { value: null, attestations: [] }
    }
    const value = profile.get(attribute)
    const attestations = claims.filter(c => {
      return (c.type === ATTESTATION_TYPE) && (c.data.attribute === attribute) && (c.data.value === value)
    }).map(a => a.issuer)
    return { value, attestations }
  }

  async set (attribute, value) {
    if (!this.did) {
      throw new Error('KiProfile must be initialized with a did to set profile attributes')
    }
    const identity = await this.ki.getIdentity(this.did)
    const profile = await this._getOrCreateProfileDb(identity)
    await profile.set(attribute, value)
  }

  async issueAttestation (subjectId, attribute, value) {
    if (!this.did) {
      throw new Error('KiProfile must be initialized with a did to issue attestations')
    }
    return this.kiClaims.issueClaim(subjectId, ATTESTATION_TYPE, { attribute, value })
  }

  async addAttestation (attestation) {
    if (!this.did) {
      throw new Error('KiProfile must be initialized with a did to add attestations')
    }
    if (attestation.type !== ATTESTATION_TYPE) {
      throw new Error('invalid attestation')
    }
    return this.kiClaims.addClaim(attestation)
  }

  async _getOrCreateProfileDb (identity) {
    if (this.dbCache[identity.did]) {
      return this.dbCache[identity.did]
    }
    const existing = await identity.get(PROFILE_DB_KEY)
    const nameOrAddress = existing || PROFILE_DB_NAME
    const db = await this.orbitConnect.keyvalue(nameOrAddress)
    if (!existing) {
      await identity.set(PROFILE_DB_KEY, db.id)
    }
    this.dbCache[identity.did] = db
    return db
  }

  async _getProfileDb (identity) {
    if (this.dbCache[identity.did]) {
      return this.dbCache[identity.did]
    }
    const existing = await identity.get(PROFILE_DB_KEY)
    if (!existing) {
      return null
    }
    const db = await this.orbitConnect.keyvalue(existing)
    this.dbCache[identity.did] = db
    return db
  }

  async _getIdentity (did) {
    if (this.identityCache[did]) {
      return this.identityCache[did]
    } else {
      const identity = await this.ki.getIdentity(did)
      this.identityCache[did] = identity
      return identity
    }
  }
}

module.exports = KiProfile
