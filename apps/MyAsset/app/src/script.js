//import '@babel/polyfill'
import { of } from './rxjs'
import Aragon from '@aragon/api'
import tokenSettings from './token-settings'
import erc20Settings  from './erc20-settings'
import { addressesEqual, hexToNumber } from './web3-utils'
import BN from 'bn.js'
import tokenAbi from './abi/minimeToken.json'
import erc20Abi from './abi/standardToken.json'
import apiAbi from './abi/api.json'
import votingAbi from './abi/voting.json'

const app = new Aragon()
const INITIALIZATION_TRIGGER = Symbol('INITIALIZATION_TRIGGER')

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

retryEvery(retry => {
  let tokenAddress, erc20Address, apiAddress, votingAddress
  app.call('token').subscribe(result => {
    tokenAddress = result
    app.call('erc20').subscribe(result => {
      erc20Address = result
      app.call('api').subscribe(result => {
        apiAddress = result
        app.call('voting').subscribe(result => {
          votingAddress = result
          initialize(tokenAddress, erc20Address, apiAddress, votingAddress)
        }, err => {
          console.error(
            'Could not start background script execution due to the contract not loading the voting address:',
            err
          )
          retry()
        })
      }, err => {
        console.error(
          'Could not start background script execution due to the contract not loading the api address:',
          err
        )
        retry()
      })
    }, err => {
      console.error(
        'Could not start background script execution due to the contract not loading the erc20 address:',
        err
      )
      retry()
    })
  }, err => {
    console.error(
      'Could not start background script execution due to the contract not loading the token address:',
      err
    )
    retry()
  })
})

async function initialize(tokenAddress, erc20Address, apiAddress, votingAddress) {
  const token = app.external(tokenAddress, tokenAbi)
  const erc20 = app.external(erc20Address, erc20Abi)
  const api = app.external(apiAddress, apiAbi)
  const voting = app.external(votingAddress, votingAbi)

  return app.store(
    async (state, {address, event, returnValues }) => {
      let nextState = {
        ...state,
      }
      if(address !== undefined && nextState.thisAddress === undefined && !addressesEqual(address, tokenAddress)){
        nextState = {
          ...nextState,
          thisAddress: address
        }
      }
      console.log('Event: ', event)
      console.log('Return Values: ', returnValues)
      switch (event) {
        case INITIALIZATION_TRIGGER:
          console.log('Init')
          return await initState({token, tokenAddress, erc20, erc20Address, api, apiAddress})
        case 'NewFundingRequest':
          return newFundingRequest(nextState, returnValues)
        case 'FundingStarted':
          return startFunding(nextState, returnValues)
        case 'Contribution':
          return newContribution(nextState, returnValues)
        case 'ReplaceManager':
          return updateManager(nextState, returnValues)
        case 'EscrowBurned':
          return escrowBurned(nextState)
        case 'ClaimedTokens':
          if (addressesEqual(returnValues._token, tokenAddress)) {
            return claimedTokens(token, nextState, returnValues)
          }
          return nextState
        case 'Transfer':
          return transfer(token, nextState, returnValues)
        case 'StartVote':
          return await updateVote(voting, nextState, returnValues)
        case 'ExecuteVote':
          return await executeVote(voting, nextState, returnValues)
        default:
          return nextState
      }
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      // Merge in the event contract's events into the app's own events for the store
      token.events(),
      voting.events(),
    ]
  )
}

async function initState({ token, tokenAddress, erc20, erc20Address, api, apiAddress }) {
  const tokenInfo = await loadSettings(token, tokenSettings)
  const erc20Info = await loadSettings(erc20, erc20Settings)
  const assetManager = await api.getAssetManager(tokenAddress).toPromise()
  const escrowID = await api.getAssetManagerEscrowID(tokenAddress, assetManager).toPromise()
  const escrowRemaining = await api.getAssetManagerEscrowRemaining(escrowID).toPromise()
  const holdingContract = await api.getContract('AssetManagerFunds').toPromise()
  const escrowContract = await api.getContract('AssetManagerEscrow').toPromise()
  const fundingGoal = await app.call('fundingProgress').toPromise()
  const fundingProgress = await app.call('fundingProgress').toPromise()
  const initialState = {
    apiAddress,
    assetManager,
    escrowRemaining,
    erc20Address,
    ...erc20Info,
    escrowContract,
    holdingContract,
    tokenAddress,
    ...tokenInfo,
    fundingGoal,
    fundingProgress,
  }
  return initialState
}
/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function claimedTokens(token, state, { _token, _controller }) {
  const changes = await loadNewBalances(token, _token, _controller)
  return updateState(state, changes)
}

async function transfer(token, state, { _from, _to }) {
  const changes = await loadNewBalances(token, _from, _to)
  // The transfer may have increased the token's total supply, so let's refresh it
  const tokenSupply = await token.totalSupply().toPromise()
  return updateState(
    {
      ...state,
      tokenSupply,
    },
    changes
  )
}

function startFunding(state, {fundingGoal}) {
  return {
    ...state,
    fundingGoal,
  }
}

function newFundingRequest(state, {requestID, amount, receipt}) {
  const { fundingGoal, fundingRequests = [] } = state
  const requestIndex = fundingRequests.findIndex(request =>
    addressesEqual(request.requestID, requestID)
  )
  if (requestIndex === -1) {
    fundingRequests.push({
      requestID,
      amount,
      receipt,
      proposed: false,
      confirmed: false,
      approved: false,
      failed: false
    })
  }
  return {
    ...state,
    fundingRequests,
  }
}

function newContribution(state, {currentProgress, currentGoal}) {
  return {
    ...state,
    fundingProgress: currentProgress,
    fundingGoal: currentGoal
  }
}

function updateManager(state, { newManager, amount }) {
  return {
    ...state,
    assetManager: newManager,
    escrowRemaining: amount,
  }
}

function escrowBurned(state) {
  return {
    ...state,
    escrowRemaining: 0
  }
}

async function updateVote(voting, state, { voteId, creator }) {
  const { thisAddress, fundingRequests = [] } = state
  if(thisAddress && addressesEqual(thisAddress, creator)){
    const results = await getVote(voting, voteId)
    const { open, executed, supportRequired, minAcceptQuorum, yea, nay, votingPower, script } = results
    const bytes = `0x${script.slice(66)}`
    if(bytes.length == 66){
      console.log('Bytes: ', bytes)
      const requestID = hexToNumber(bytes)
      console.log('RequestID: ', requestID)
      const requestIndex = fundingRequests.findIndex(request =>
        request.requestID == requestID
      )
      console.log('Request index: ', requestIndex)
      if (requestIndex !== -1) {
        //Set initiated to true
        fundingRequests[requestIndex].voteID = voteId
        fundingRequests[requestIndex].proposed = true
        if(open === false && executed === false){
          const bnYea = new BN(yea)
          const bnNay = new BN(nay)
          const bnVotingPower = new BN(votingPower)
          const bnSupportRequired = new BN(supportRequired)
          const bnMinQuorum = new BN(minAcceptQuorum)
          const totalVotes = bnYea.add(bnNay);
          if (totalVotes.isZero()) {
            fundingRequests[requestIndex].failed = true
          } else {
            const pctBase = new BN(10).pow(new BN(18))
            const yeaPct = bnYea.mul(pctBase).div(totalVotes)
            const yeaOfTotalPowerPct = bnYea.mul(pctBase).div(bnVotingPower)
            // Mirror on-chain calculation
            // yea / votingPower > supportRequired ||
            //   (yea / totalVotes > supportRequired &&
            //    yea / votingPower > minAcceptQuorum)
            if(yeaOfTotalPowerPct.gt(bnSupportRequired) || (yeaPct.gt(bnSupportRequired) && yeaOfTotalPowerPct.gt(bnMinQuorum))){
              fundingRequests[requestIndex].approved = true
            } else {
              fundingRequests[requestIndex].failed = true
            }
          }
        } else if(executed === true){
          fundingRequests[requestIndex].approved = true
          fundingRequests[requestIndex].confirmed = true
        }
      }
      return {
        ...state,
        fundingRequests
      }
    } else {
      return state
    }
  } else {
    return state
  }
}

async function executeVote(voting, state, {voteId}) {
  const { fundingRequests = [] } = state
  const requestIndex = fundingRequests.findIndex(request =>
    request.voteID == voteId
  )
  if (requestIndex !== -1) {
    fundingRequests[requestIndex].approved = true
    fundingRequests[requestIndex].confirmed = true
  }
  return {
    ...state,
    fundingRequests
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function updateState(state, changes) {
  const { holders = [] } = state
  return {
    ...state,
    holders: changes
      .reduce(updateHolders, holders)
      // Filter out any addresses that now have no balance
      .filter(({ balance }) => balance > 0),
  }
}

function updateHolders(holders, changed) {
  const holderIndex = holders.findIndex(holder =>
    addressesEqual(holder.address, changed.address)
  )

  if (holderIndex === -1) {
    // If we can't find it, concat
    return holders.concat(changed)
  } else {
    const nextHolders = Array.from(holders)
    nextHolders[holderIndex] = changed
    return nextHolders
  }
}

function loadNewBalances(token, ...addresses) {
  return Promise.all(
    addresses.map(address =>
      token
        .balanceOf(address)
        .toPromise()
        .then(balance => ({ address, balance }))
    )
  ).catch(err => {
    console.error(
      `Failed to load new balances for ${addresses.join(', ')} due to:`,
      err
    )
    // Return an empty object to avoid changing any state
    // TODO: ideally, this would actually cause the UI to show "unknown" for the address
    return {}
  })
}

function loadSettings(token, settings) {
  return Promise.all(
    settings.map(([name, key]) =>
      token[name]()
        .toPromise()
        .then(value => ({ [key]: value }))
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

function getVote(voting, id){
  return new Promise((resolve, reject) =>
    voting
      .getVote(id)
      .subscribe(resolve, reject)
  )
}
