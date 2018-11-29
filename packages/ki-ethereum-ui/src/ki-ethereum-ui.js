const Ki = require('../../ki/src/ki')
const KistoreEth = require('../../kistore-eth/src/kistore-eth')
const KiProfile = require('../../ki-profile/src/ki-profile')
const Web3 = require('web3')
const choo = require('choo')
const html = require('choo/html')
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
    profileAttributes: { name, bio },
    inputs,
    image,
    loading
  } = state
  window.state = state
  const canEdit = !state.params.wallet
  const _name = (name && name.value) || 'Anonymous'
  const src = image ? `https://ipfs.infura.io/ipfs/${image.contentUrl['/']}` : 'http://tachyons.io/img/logo.jpg'
  const loadingSpinner = html`
    <div class="dark-overlay" onclick="return false;">
      <div class="lds-dual-ring"></div>
    </div>
  `

  const footer = html`
    <footer class="tc pv4 pv5-ns">
      <div class="f6 gray fw2 tracked">Ki-Ethereum</div>
      <div class="f6 gray fw2 tracked">Copyright and related rights waived via <a class="blue no-underline underline-hover" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank">CC0</a>.</div>
      <div class="f6 gray fw2 tracked">Source code on <a class="blue no-underline underline-hover" href="https://github.com/projectaspen/aspen" target="_blank">github</a>.</div>
    </footer>
  `

  const viewContent = html`
      <header class="tc pv4 pv5-ns">
        <img src=${src} class="br-100 pa1 ba b--black-10 h3 w3" alt="avatar">
        <h1 class="f5 f4-ns fw6 mid-gray">${_name}</h1>
        ${did ? html`
          <h2 class="f6 gray fw2 tracked">${did}</h2>
        ` : null}
        ${(bio && bio.value) ? html`
          <h2 class="f5 gray fw2 tracked">${bio.value}</h2>
        ` : null}
      </header>
  `

  const editContent = html`
    <div>
      <header class="tc pv4 pv5-ns">
        <img src=${src} class="br-100 pa1 ba b--black-10 h3 w3" alt="avatar">
        <h1 class="f5 f4-ns fw6 mid-gray">${_name}</h1>
        ${did ? html`
          <h2 class="f6 gray fw2 tracked">${did}</h2>
        ` : null}
        ${canEdit ? html`
          <div>
            <h3><a target="_blank" href="/#wallet/${state.myWallet}" class="f5 fw6 db blue no-underline underline-hover">My public profile</a></h3>
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
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.enable()
      } catch (error) {
        console.error('denied access')
        // User denied account access...
        return
      }
    } else if (!window.web3) {
      window.alert('Please use a web3-enabled browser')
      return
    }
    state.web3Provider = window.ethereum || window.web3.currentProvider
    const web3 = new Web3(state.web3Provider)
    const id = await web3.eth.net.getId()
    if (id !== 4) {
      window.alert('Please switch to the Rinkeby testnet.')
      return
    }
    const accounts = await web3.eth.getAccounts()
    if (accounts.length === 0) {
      window.alert('Please enable your web3 browser by logging in')
      return
    }
    state.myWallet = accounts[0]
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
    let kistoreEth
    const { myWallet, web3Provider } = state
    kistoreEth = new KistoreEth(web3Provider)
    await kistoreEth.importPublicKey(myWallet)
    const keyAdapters = [ kistoreEth ]
    state.ki = new Ki({ keyAdapters, nodes: KI_NODES })
    await state.ki.connection
    const wallet = state.params.wallet || myWallet
    state.did = await state.ki.deriveDid(kistoreEth, wallet.toLowerCase())
    state.identity = await state.ki.getIdentity(state.did)
    state.profile = new KiProfile({ ki: state.ki, did: state.did })
    emitter.emit('loadProfile')
  })

  emitter.on('loadProfile', async function () {
    const name = await state.profile.get(state.did, 'name')
    const bio = await state.profile.get(state.did, 'bio')
    state.profileAttributes = { name, bio }
    state.inputs = { name: name.value, bio: bio.value }
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
}
