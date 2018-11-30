const Ki = require('../../ki/src/ki')
const KistoreEth = require('../../kistore-eth/src/kistore-eth')
const KiProfile = require('../../ki-profile/src/ki-profile')
const Web3 = require('web3')
const choo = require('choo')
const html = require('choo/html')
const makeBlockie = require('ethereum-blockies-base64')
require('../node_modules/tachyons/css/tachyons.min.css')

const KI_NODES = [
  '/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmTWv5fGvUSFS8K86zxgGRYCEDLJLqGAXa5yjcZKG6weC5'
]

const app = choo()
app.use(store)
app.route('/', mainView)
app.route('/wallet/:wallet', mainView)
app.mount('body')

function mainView (state, emit) {
  const {
    did,
    profileAttributes: { name, bio, twitter, github },
    inputs,
    loading
  } = state
  window.state = state
  const canEdit = !state.params.wallet
  const _name = (name && name.value) || 'Anonymous'
  const blockie = makeBlockie(did || 'anonymous')
  const loadingSpinner = html`
    <div class="dark-overlay" onclick="return false;">
      <div class="lds-dual-ring"></div>
    </div>
  `

  const footer = html`
    <footer class="tc pv4 pv5-ns">
      ${!canEdit ? html`
        <div class="f6 gray fw2 tracked">
          <h3><a href="/" class="f5 fw6 db blue no-underline underline-hover">My profile</a></h3>
        </div>
      ` : null}
      <div class="f6 gray fw2 tracked">Ki-Ethereum</div>
      <div class="f6 gray fw2 tracked">Copyright and related rights waived via <a class="blue no-underline underline-hover" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank">CC0</a>.</div>
      <div class="f6 gray fw2 tracked">Source code on <a class="blue no-underline underline-hover" href="https://github.com/projectaspen/aspen" target="_blank">github</a>.</div>
    </footer>
  `

  const viewContent = html`
    <div>
      <header class="tc pv4 pv5-ns">
        <img src=${blockie} class="br-100 pa1 ba b--black-10 h3 w3" alt="avatar">
        <h1 class="f5 f4-ns fw6 mid-gray">${_name}</h1>
        ${did ? html`
          <h2 class="f6 gray fw2 tracked">${did}</h2>
        ` : null}
        ${(bio && bio.value) ? html`
          <h2 class="f5 gray fw2 tracked">${bio.value}</h2>
        ` : null}
        <ul class="list pl0 measure center">
          ${twitter && twitter.value ? html`
            <li class="lh-copy pv3 ba bl-0 bt-0 br-0 b--dotted b--black-30 tl">
              <a class="link dim gray dib h2 w2 br-100 mr3 pa2 bg-near-white ba b--black-10" href="https://twitter.com/${twitter.value}" target="_blank" title="">
                <svg data-icon="twitter" viewBox="0 0 32 32" style="fill:currentcolor">
                  <path d="M2 4 C6 8 10 12 15 11 A6 6 0 0 1 22 4 A6 6 0 0 1 26 6 A8 8 0 0 0 31 4 A8 8 0 0 1 28 8 A8 8 0 0 0 32 7 A8 8 0 0 1 28 11 A18 18 0 0 1 10 30 A18 18 0 0 1 0 27 A12 12 0 0 0 8 24 A8 8 0 0 1 3 20 A8 8 0 0 0 6 19.5 A8 8 0 0 1 0 12 A8 8 0 0 0 3 13 A8 8 0 0 1 2 4" />
                </svg>
              </a>
              <a class="link dim gray dib h2" href="https://twitter.com/${twitter.value}" target="_blank" title="">
                ${twitter.value}
              </a>
            </li>
          ` : null}
          ${github && github.value ? html`
            <li class="lh-copy pv3 ba bl-0 bt-0 br-0 b--dotted b--black-30 tl">
              <a class="link dim gray dib br-100 h2 w2 mr3 pa2 bg-near-white ba b--black-10" href="https://github.com/${github.value}" target="_blank" title="">
                <svg data-icon="github" viewBox="0 0 32 32" style="fill:currentcolor">
                  <path d="M0 18 C0 12 3 10 3 9 C2.5 7 2.5 4 3 3 C6 3 9 5 10 6 C12 5 14 5 16 5 C18 5 20 5 22 6 C23 5 26 3 29 3 C29.5 4 29.5 7 29 9 C29 10 32 12 32 18 C32 25 30 30 16 30 C2 30 0 25 0 18 M3 20 C3 24 4 28 16 28 C28 28 29 24 29 20 C29 16 28 14 16 14 C4 14 3 16 3 20 M8 21 A1.5 2.5 0 0 0 13 21 A1.5 2.5 0 0 0 8 21 M24 21 A1.5 2.5 0 0 0 19 21 A1.5 2.5 0 0 0 24 21 z" />
                </svg>
              </a>
              <a class="link dim gray dib h2" href="https://github.com/${github.value}" target="_blank" title="">
                ${github.value}
              </a>
            </li>
          ` : null}
        </ul>
      </header>
    </div>
  `

  const editContent = html`
    <div>
      <header class="tc pv4 pv5-ns">
        <img src=${blockie} class="br-100 pa1 ba b--black-10 h3 w3" alt="avatar">
        <h1 class="f5 f4-ns fw6 mid-gray">${_name}</h1>
        ${did ? html`
          <h2 class="f6 gray fw2 tracked">${did}</h2>
        ` : null}
        ${canEdit ? html`
          <div>
            <h3><a href="#wallet/${state.myWallet}" class="f5 fw6 db blue no-underline underline-hover">My public profile</a></h3>
          </div>
        ` : null}

      </header>
      ${did ? html`
        <section class="mw5 mw7-ns center bg-light-gray pa3 ph5-ns">
          <article class="pa4 black-80">
            <fieldset id="sign_up" class="ba b--transparent ph0 mh0">
              <legend class="ph0 mh0 fw6 clip">Sign Up</legend>
              <div class="mt3">
                <label class="db fw4 lh-copy f6" for="name">Name</label>
                <input class="pa2 input-reset ba bg-transparent w-100 measure" type="text" name="name" onchange=${updateInput('name')} value=${inputs.name || ''}>
              </div>
              <div class="mt3">
                <label class="db fw4 lh-copy f6" for="bio">Bio</label>
                <textarea id="bio" name="bio" class="pa2 input-reset ba bg-transparent w-100 measure" onchange=${updateInput('bio')}>${inputs.bio || ''}</textarea>
              </div>
              <div class="mt3">
                <label class="db fw4 lh-copy f6" for="twitter">Twitter</label>
                <input class="pa2 input-reset ba bg-transparent w-100 measure" type="text" name="twitter" onchange=${updateInput('twitter')} value=${inputs.twitter || ''}>
              </div>
              <div class="mt3">
                <label class="db fw4 lh-copy f6" for="Github">Github</label>
                <input class="pa2 input-reset ba bg-transparent w-100 measure" type="text" name="github" onchange=${updateInput('github')} value=${inputs.github || ''}>
              </div>
            </fieldset>
            <div class="mt3"><button class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onclick=${saveChanges}>Save changes</button></div>
          </article>
        </section>
      ` : null}
    </div>
  `

  const content = html`
    <body>
      ${loading ? loadingSpinner : null}
      ${canEdit ? editContent : viewContent}
      ${footer}
    </body>
  `
  return content

  function updateInput (field) {
    return (evt) => {
      emit('updateInput', field, evt.target.value)
    }
  }

  async function saveChanges () {
    emit('updateProfile')
  }
}

function store (state, emitter) {
  state.profileAttributes = {}
  state.inputs = {}
  state.loading = true

  emitter.on('DOMContentLoaded', async function () {
    emitter.emit('render')
    emitter.emit('init')
  })

  emitter.on('startLoading', async function () {
    state.loading = true
    emitter.emit('render')
  })

  emitter.on('endLoading', async function () {
    state.loading = false
    emitter.emit('render')
  })

  emitter.on('init', async function () {
    emitter.emit('startLoading')
    const isReadOnly = Boolean(state.params.wallet)
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.enable()
      } catch (error) {
        console.error('denied access')
        // User denied account access...
        return
      }
    }
    if (!isReadOnly) {
      state.web3Provider = window.ethereum || (window.web3 && window.web3.currentProvider) || Web3.givenProvider
      const web3 = new Web3(state.web3Provider)
      const accounts = await web3.eth.getAccounts()
      if (accounts.length === 0) {
        window.alert('Please enable your web3 browser by logging in')
        return
      }
      state.myWallet = accounts[0]
    }
    const { myWallet, web3Provider } = state
    const wallet = state.params.wallet || myWallet
    state.kistoreEth = state.kistoreEth || new KistoreEth(web3Provider)
    await state.kistoreEth.importPublicKey(wallet)
    const keyAdapters = [ state.kistoreEth ]
    state.ki = state.ki || new Ki({ keyAdapters, nodes: KI_NODES })
    await state.ki.connection
    state.did = await state.ki.deriveDid(state.kistoreEth, wallet.toLowerCase())
    const savedDid = window.localStorage.getItem('did')
    if (savedDid === state.did) {
      state.identity = await state.ki.getIdentity(state.did)
    } else if (!isReadOnly) {
      state.identity = await state.ki.createIdentity(state.did)
      window.localStorage.setItem('did', state.did)
    }
    state.profile = new KiProfile({ ki: state.ki, did: state.did })
    emitter.emit('loadProfile')
  })

  emitter.on('loadProfile', async function () {
    const name = await state.profile.get(state.did, 'name')
    const bio = await state.profile.get(state.did, 'bio')
    const twitter = await state.profile.get(state.did, 'twitter')
    const github = await state.profile.get(state.did, 'github')
    state.profileAttributes = { name, bio, twitter, github }
    state.inputs = {
      name: name.value,
      bio: bio.value,
      twitter: twitter.value,
      github: github.value
    }
    emitter.emit('endLoading')
  })

  emitter.on('updateInput', function (field, value) {
    state.inputs[field] = value
    emitter.emit('render')
  })

  emitter.on('updateProfile', async function (attribute, value) {
    emitter.emit('startLoading')
    const inputKeys = Object.keys(state.inputs)
    for (var i = 0; i < inputKeys.length; i++) {
      const field = inputKeys[i]
      if (state.inputs[field] !== state.profileAttributes[field].value) {
        await state.profile.set(field, state.inputs[field])
      }
    }
    emitter.emit('loadProfile')
  })

  emitter.on('navigate', function () {
    emitter.emit('init')
  })
}
