import Aragon from '@aragon/client'
import { of } from './rxjs'
import tokenSettings, { hasLoadedTokenSettings } from './token-settings'
import { addressesEqual } from './web3-utils'
import tokenAbi from './abi/minimeToken.json'

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
  let tokenAddress

  app
    .call('token')
    .first()
    .subscribe(
      function(result) {
        initialize(result)
      }
      , err => {
      console.error(
        'Could not start background script execution due to the contract not loading the token:',
        err
      )
      retry()
    })
})

async function initialize(tokenAddr) {
  const token = app.external(tokenAddr, tokenAbi)
  try {
    const tokenSymbol = await loadTokenSymbol(token)
    app.identify(tokenSymbol);
  } catch (err) {
    console.error(
      `Failed to load token symbol for token at ${tokenAddr} due to:`,
      err
    )
  }

  return createStore(token, tokenAddr)
}

// Hook up the script as an aragon.js store
async function createStore(token, tokenAddr) {
  return app.store(
    async (state, { address, event, returnValues }) => {
      let nextState = {
        ...state,
        // Fetch the app's settings, if we haven't already
        ...(!hasLoadedTokenSettings(state)
          ? await loadTokenSettings(token)
          : {}),
      }
      if (event === INITIALIZATION_TRIGGER) {
        nextState = {
          ...nextState,
          holders: [],
          tokenAddress: tokenAddr,
          erc20Address: await loadERC20(),
        }
      } else if (addressesEqual(address, tokenAddr)) {
        switch (event) {
          case 'Transfer':
            nextState = await transfer(token, nextState, returnValues)
            break
          default:
            break
        }
      } else {
        switch (event) {
          case 'TokenClaimed':
            nextState = await tokenClaimed(nextState, returnValues)
            break
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
async function transfer(token, state, { _from, _to, _amount }) {
  //const changes = await loadNewBalances(token, _from, _to)
  console.log('Transfer event')
  let changes;
  if(_from != "0x0000000000000000000000000000000000000000"){
    changes = {
      address : _from,
      balance : String(-Number(_amount))
    }
  } else if(_to != "0x0000000000000000000000000000000000000000"){
    changes = {
      address : _to,
      balance : _amount
    }
  }
  if(changes){
    // The transfer may have increased the token's total supply, so let's refresh it
    const tokenSupply = await loadTokenSupply(token)
    return updateHolderState(
      {
        ...state,
        tokenSupply,
      },
      changes
    )
  }
}

async function tokenClaimed(state, { user }) {
  const changes = {
    address: user,
    claimed: true,
  }
  return updateClaimedState(
    { ...state },
    changes
  )
}

async function tokensLocked(token, state, { user, amount }) {
  const changes = {
    address: user,
    locked: amount,
  }
  return updateLockedState(
    { ...state },
    changes
  )
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function updateHolderState(state, changes) {
  const { holders = [] } = state
  return {
    ...state,
    holders: updateHolders(holders, changes),
  }
}

function updateClaimedState(state, changes) {
  const { holders = [] } = state
  return {
    ...state,
    holders: updateClaims(holders, changes)
  }
}

function updateLockedState(state, changes) {
  const { holders = [] } = state
  return {
    ...state,
    holders: updateLockers(holders, changes)
  }
}


function updateHolders(holders, changed) {
  const holderIndex = holders.findIndex(holder =>
    addressesEqual(holder.address, changed.address)
  )
  if (holderIndex === -1 && changed.balance > 0) {
    holders.push(changed)
  } else {
    if(!holders[holderIndex].balance){
      holders[holderIndex].balance = '0'
    }
    holders[holderIndex].balance = String(Number(holders[holderIndex].balance) + Number(changed.balance))
  }
  return holders
}

function updateClaims(holders, changed) {
  const claimantIndex = holders.findIndex(claimant =>
    addressesEqual(claimant.address, changed.address)
  )
  if(claimantIndex === -1) {
    holders.push(changed)
  } else {
    holders[claimantIndex].claimed = changed.claimed
  }
  return holders
}

function updateLockers(holders, changed) {
  const lockerIndex = holders.findIndex(locker =>
    addressesEqual(locker.address, changed.address)
  )
  if(lockerIndex === -1) {
    holders.push(changed)
  } else {
    holders[lockerIndex].locked = changed.locked
  }
  return holders
}

function loadERC20() {
  return new Promise((resolve, reject) =>
    app
      .call('erc20')
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

function loadTokenSymbol(token) {
  return new Promise((resolve, reject) =>
    token
      .symbol()
      .first()
      .subscribe(resolve, reject)
  )
}
