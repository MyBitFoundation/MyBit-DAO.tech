import Aragon from '@aragon/client'
import BN from 'bn.js'
import { of } from './rxjs'
import { addressesEqual } from './web3-utils'
import votingAbi from './abi/voting.json'


const INITIALIZATION_TRIGGER = Symbol('INITIALIZATION_TRIGGER')

const app = new Aragon()

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
  let token, voting;
  app
    .call('token')
    .first()
    .subscribe(
      function(result) {
        token = result;
        app
          .call('voting')
          .first()
          .subscribe(
            function(result) {
              voting = result;
              createStore(token, voting)
            }
            , err => {
            console.error(
              'Could not start background script execution due to the contract not loading voting:',
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

// Hook up the script as an aragon.js store
async function createStore(tokenAddr, votingAddr) {
  const voting = app.external(votingAddr, votingAbi)
  return app.store(
    async (state, {address, event, returnValues }) => {
      let nextState
      if (state === null) {
        nextState = {
          identities:[]
        }
      } else {
        nextState = {
          ...state,
        }
      }
      if (event === INITIALIZATION_TRIGGER) {
        nextState = {
          ...nextState,
          tokenAddress: tokenAddr,
          votingAddress: votingAddr,
        }
      } else if (addressesEqual(address, votingAddr)) {
        switch (event) {
          case 'StartVote':
            nextState = await updateVote(voting, nextState, returnValues)
            break
          default:
            break
        }
      } else {
        if(!nextState.identityAddress) {
          nextState = {
            ...nextState,
            identityAddress: address
          }
        }
        switch (event) {
          case 'NewSubmission':
            nextState = updateRequests(nextState, returnValues)
            break
          case 'Authorized':
            nextState = updateAuthorized(nextState, returnValues)
            break
          case 'Revoked':
            nextState = updateRevoked(nextState, returnValues)
            break
        }
      }
      return nextState
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      // Merge in the token's events into the app's own events for the store
      voting.events(),
    ])
}
/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function updateRequests(state, returnValues) {
  const { identities = [] } = state
  const idIndex = identities.findIndex(id =>
    addressesEqual(id.user, returnValues.user)
  )
  if (idIndex === -1) {
    identities.push({
      ...returnValues,
      initiated: false,
      authorized: false,
      approved: false,
      failed: false
    })
  } else {
    identities[idIndex] = {
      ...returnValues,
      initiated: false,
      authorized: false,
      approved: false,
      failed: false,
    }
  }
  return {
    ...state,
    identities
  }
}
function updateAuthorized(state, { user, requestID }) {
  const { identities = [] } = state
  const idIndex = identities.findIndex(id =>
    addressesEqual(id.user, user)
  )
  if (idIndex !== -1) {
    identities[idIndex].failed = false
    identities[idIndex].authorized = true
  }
  return {
    ...state,
    identities
  }
}
function updateRevoked(state, { user, requestID }) {
  const { identities = [] } = state
  const idIndex = identities.findIndex(id =>
    addressesEqual(id.user, user)
  )
  if (idIndex !== -1) {
    identities[idIndex].authorized = false
    identities[idIndex].approved = false
    identities[idIndex].failed = true
  }
  return {
    ...state,
    identities
  }
}
async function updateVote(voting, state, { voteId, creator }) {
  if(state.identityAddress){
    const { identityAddress, identities = [] } = state
    const subscript = '0x00000001' + identityAddress.substr(2).toLowerCase() + '0000002476c51f02000000000000000000000000'
    const { open, executed, supportRequired, minAcceptQuorum, yea, nay, votingPower, script } = await getVote(voting, voteId)
    const pctBase = new BN(10).pow(new BN(18))
    if(script.includes(subscript)) {
      const user = script.replace(subscript, '0x')
      const idIndex = identities.findIndex(id =>
        addressesEqual(id.user, user)
      )
      if (idIndex !== -1) {
        //Set initiated to true
        identities[idIndex].initiated = true
        if(open === false && executed === false){

          const bnYea = new BN(yea)
          const bnNay = new BN(nay)
          const bnVotingPower = new BN(votingPower)
          const bnSupportRequired = new BN(supportRequired)
          const bnMinQuorum = new BN(minAcceptQuorum)
          const totalVotes = bnYea.add(bnNay);
          if (totalVotes.isZero()) {
            identities[idIndex].failed = true
          } else {
            const yeaPct = bnYea.mul(pctBase).div(totalVotes)
            const yeaOfTotalPowerPct = bnYea.mul(pctBase).div(bnVotingPower)
            // Mirror on-chain calculation
            // yea / votingPower > supportRequired ||
            //   (yea / totalVotes > supportRequired &&
            //    yea / votingPower > minAcceptQuorum)
            if(yeaOfTotalPowerPct.gt(bnSupportRequired) || (yeaPct.gt(bnSupportRequired) && yeaOfTotalPowerPct.gt(bnMinQuorum))){
              identities[idIndex].approved = true
            } else {
              identities[idIndex].failed = true
            }
          }
        }
      }
      return {
        ...state,
        identities
      }
    } else {
      return state
    }
  } else {
    return state
  }
}

function getVote(voting, id){
  return new Promise((resolve, reject) =>
    voting
      .getVote(id)
      .first()
      .subscribe(resolve, reject)
  )
}
