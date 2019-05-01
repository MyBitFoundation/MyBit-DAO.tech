import Aragon from '@aragon/client'
import { of } from './rxjs'
import tokenSettings, { hasLoadedTokenSettings } from './token-settings'
import erc20Settings, { hasLoadedERC20Settings } from './erc20-settings'
import lockSettings, { hasLoadedLockSettings } from './lock-settings'
import { addressesEqual } from './web3-utils'
import tokenAbi from './abi/minimeToken.json'
import erc20Abi from './abi/standardToken.json'


const INITIALIZATION_TRIGGER = Symbol('INITIALIZATION_TRIGGER')

const app = new Aragon();

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */
const retryEvery = (callback, initialRetryTimer = 1000, increaseFactor = 5) => {
  const attempt = (retryTimer = initialRetryTimer) => {
    // eslint-disable-next-line standard/no-callback-literal
    callback(() => {
      console.error(`Retrying in ${retryTimer / 1000}s...`)

      // Exponentially backoff attempts
      setTimeout(() => attempt(retryTimer * increaseFactor), retryTimer)
    })
  }
  attempt()
}

// Get the token address to initialize ourselves
retryEvery(retry => {
  let tokenAddress, erc20Address

  app
    .call('token')
    .first()
    .subscribe(
      function(result) {
        tokenAddress = result
        app
          .call('erc20')
          .first()
          .subscribe(
            function(result) {
              erc20Address = result
              initialize(tokenAddress, erc20Address)
            }
            , err => {
            console.error(
              'Could not start background script execution due to the contract not loading the erc20:',
              err
            )
            retry()
          })
      }
      , err => {
      console.error(
        'Could not start background script execution due to the contract not loading the token:',
        err
      )
      retry()
    })
})

async function initialize(tokenAddr, erc20Addr) {
  const token = app.external(tokenAddr, tokenAbi)
  const erc20 = app.external(erc20Addr, erc20Abi)
  try {
    const tokenSymbol = await loadTokenSymbol(token)
    app.identify(tokenSymbol);
  } catch (err) {
    console.error(
      `Failed to load token symbol for token at ${tokenAddr} due to:`,
      err
    )
  }

  return createStore(token, tokenAddr, erc20, erc20Addr)
}

// Hook up the script as an aragon.js store
async function createStore(token, tokenAddr, erc20, erc20Addr) {
  return app.store(
    async (state, { address, event, returnValues }) => {
      let nextState = {
        ...state,
        // Fetch the app's settings, if we haven't already
        ...(!hasLoadedTokenSettings(state)
          ? await loadTokenSettings(token)
          : {}),
        ...(!hasLoadedERC20Settings(state)
          ? await loadERC20Settings(erc20)
          : {}),
        ...(!hasLoadedLockSettings(state)
          ? await loadLockSettings()
          : {}),
      }
      if (event === INITIALIZATION_TRIGGER) {
        nextState = {
          ...nextState,
          holders: [],
          tokenAddress: tokenAddr,
          erc20Address: erc20Addr,
        }
      } else {
        switch (event) {
          case 'TokensLocked':
            nextState = await tokensLocked(token, nextState, returnValues)
            break
          default:
            break
        }
      }

      return nextState
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      // Merge in the token's events into the app's own events for the store
      token.events(),
      //tokensale.events(),
    ]
  )
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/
async function tokensLocked(token, state, { user, amount }) {
  const tokenSupply = await loadTokenSupply(token)
  let balance
  if(amount > 0){
    balance = await loadBalance(token, user)
  } else {
    balance = '0'
  }
  const changes = {
    address: user,
    locked: amount,
    balance: balance,
  }

  return updateLockedState(
    {
      ...state,
      tokenSupply
    },
    changes
  )
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function updateLockedState(state, changes) {
  const { holders = [] } = state
  return {
    ...state,
    holders: updateLockers(holders, changes)
  }
}

function updateLockers(holders, changed) {
  const lockerIndex = holders.findIndex(locker =>
    addressesEqual(locker.address, changed.address)
  )
  if(lockerIndex === -1) {
    holders.push(changed)
  } else {
    holders[lockerIndex].locked = changed.locked
    holders[lockerIndex].balance = changed.balance
  }
  return holders
}

function loadTokenSettings(token) {
  return Promise.all(
    tokenSettings.map(
      ([name, key, type = 'string']) =>
        new Promise((resolve, reject) =>
          token[name]()
            .first()
            .subscribe(value => {
              resolve({ [key]: value })
            }, reject)
        )
    )
  )
    .then(settings =>
      settings.reduce((acc, setting) => ({ ...acc, ...setting }), {})
    )
    .catch(err => {
      console.error("Failed to load token's settings", err)
      // Return an empty object to try again later
      return {}
    })
}

function loadERC20Settings(token) {
  return Promise.all(
    erc20Settings.map(
      ([name, key, type = 'string']) =>
        new Promise((resolve, reject) =>
          token[name]()
            .first()
            .subscribe(value => {
              resolve({ [key]: value })
            }, reject)
        )
    )
  ).then(settings =>
      settings.reduce((acc, setting) => ({ ...acc, ...setting }), {})
    )
    .catch(err => {
      console.error("Failed to load token's settings", err)
      // Return an empty object to try again later
      return {}
    })
}

function loadLockSettings() {
  return Promise.all(
    lockSettings.map(
      ([name, key, type = 'array']) =>
        new Promise((resolve, reject) =>
          app.call(name)
            .first()
            .subscribe(value => {
              resolve({ [key]: value })
            }, reject)
        )
    )
  ).then(settings =>
      settings.reduce((acc, setting) => ({ ...acc, ...setting }), {})
    )
    .catch(err => {
      console.error("Failed to load token's settings", err)
      // Return an empty object to try again later
      return {}
    })
}

function loadBalance(token, address) {
  return new Promise((resolve, reject) =>
    token
      .balanceOf(address)
      .first()
      .subscribe(resolve, reject)
  )
}

function loadTokenSupply(token) {
  return new Promise((resolve, reject) =>
    token
      .totalSupply()
      .first()
      .subscribe(resolve, reject)
  )
}

function loadTokenSymbol(token) {
  return new Promise((resolve, reject) =>
    token
      .symbol()
      .first()
      .subscribe(resolve, reject)
  )
}
