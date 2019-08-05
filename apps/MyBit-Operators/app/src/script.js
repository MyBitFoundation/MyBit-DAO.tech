import { of } from './rxjs'
import Aragon from '@aragon/api'
import eventsAbi from './abi/events.json'
import votingAbi from './abi/voting.json'
import BN from 'bn.js'
import { addressesEqual, asciiToHex, padRight } from './web3-utils'

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

// Get the token address to initialize ourselves
retryEvery(retry => {
  let eventsAddress, votingAddress
  app.call('getEvents').subscribe(result => {
    eventsAddress = result
    app.call('voting').subscribe(result => {
      votingAddress = result
      initialize(eventsAddress, votingAddress)
    }, err => {
      console.error(
        'Could not start background script execution due to the contract not loading the voting address:',
        err
      )
      retry()
    })
  }, err => {
    console.error(
      'Could not start background script execution due to the contract not loading the events address:',
      err
    )
    retry()
  })
})

async function initialize(eventsAddress, votingAddress) {
  const eventsContract = app.external(eventsAddress, eventsAbi)
  const votingContract = app.external(votingAddress, votingAbi)

  return app.store(
    async (state, {address, event, returnValues }) => {
      let nextState = {
        ...state,
      }
      if(address !== undefined && nextState.thisAddress === undefined && !addressesEqual(address, eventsAddress) && !addressesEqual(address, votingAddress)){
        nextState = {
          ...nextState,
          thisAddress: address
        }
      }
      switch (event) {
        case INITIALIZATION_TRIGGER:
          return initState()
        case 'NewRequest':
          return newRequest(nextState, returnValues)
        case 'LogOperator':
          return operatorEvent(nextState, returnValues)
        case 'StartVote':
          return await updateVote(votingContract, nextState, returnValues)
        case 'ExecuteVote':
          return await executeVote(votingContract, nextState, returnValues)
        default:
          return nextState
      }
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      // Merge in the event contract's events into the app's own events for the store
      eventsContract.events(0),
      votingContract.events()
    ])
}

function initState() {
  return {
    operators: [],
    isSyncing: true,
  }
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/
function newRequest(state, { operatorID, name, operatorAddress, referrerAddress, ipfs, assetType }) {
  const { operators = [] } = state
  const operatorIndex = operators.findIndex(operator =>
    operator.id.toLowerCase() == operatorID.toLowerCase()
  )
  if (operatorIndex === -1) {
    operators.push({
      id: operatorID,
      name: name,
      address: operatorAddress,
      referrer: referrerAddress,
      ipfs: ipfs,
      assetType: assetType,
      approved: false,
      proposed: false,
      confirmed: false,
      removed: false,
      failed: false
    })
  } else {
    operators[operatorIndex].address = operatorAddress
    operators[operatorIndex].referrer = referrerAddress
    operators[operatorIndex].ipfs = ipfs
    operators[operatorIndex].assetType = assetType
  }

  return {
    ...state,
    operators
  }
}

function operatorEvent(state, { message, messageID, id, name, ipfs, account, origin }) {
  const { operators = [], assets = [] } = state

  if(message === 'Operator removed') {
    const operatorIndex = operators.findIndex(operator =>
      bytesEqual(operator.id, id)
    )

    if (operatorIndex !== -1) {
      operators[operatorIndex].removed = true
    }
  } else if(message === 'Operator registered'){
    const operatorIndex = operators.findIndex(operator =>
      operator.id.toLowerCase() == id.toLowerCase()
    )
    if (operatorIndex === -1) {
      operators.push({
        id: id,
        name: name,
        address: account,
        referrer: '0x0000000000000000000000000000000000000000',
        ipfs: ipfs,
        assetType: '',
        proposed: false,
        confirmed: true,
        removed: false,
        failed: false
      })
    } else {
      operators[operatorIndex].confirmed = true
    }
  } else if(message === 'Asset added') {
    const assetIndex = assets.findIndex(asset =>
      asset.id.toLowerCase() == id.toLowerCase()
    )
    if (assetIndex === -1) {
      assets.push({
        id: id,
        name: name,
        address: origin,
        ipfs: ipfs,
      })
    }
  } else if(message === 'Asset removed') {
    const assetIndex = assets.findIndex(asset =>
      asset.id.toLowerCase() == id.toLowerCase()
    )
    if (assetIndex !== -1) {
      assets.splice(assetIndex, 1)
    }
  }

  return {
    ...state,
    operators,
    assets,
  }
}

async function updateVote(voting, state, { voteId }) {
  if(state.thisAddress){
    const { thisAddress, operators = [] } = state
    const { open, executed, supportRequired, minAcceptQuorum, yea, nay, votingPower, script } = await getVote(voting, voteId)
    if(script.includes(thisAddress.substr(2).toLowerCase())) {
      const bytes = `0x${script.slice(194)}`
      const hexLength = bytes.length-2
      const operatorIndex = operators.findIndex(operator =>
        padRight(asciiToHex(operator.name), hexLength) === bytes
      )
      if (operatorIndex !== -1) {
        //Set initiated to true
        operators[operatorIndex].proposed = true
        if(open === false && executed === false){
          const bnYea = new BN(yea)
          const bnNay = new BN(nay)
          const bnVotingPower = new BN(votingPower)
          const bnSupportRequired = new BN(supportRequired)
          const bnMinQuorum = new BN(minAcceptQuorum)
          const totalVotes = bnYea.add(bnNay);
          if (totalVotes.isZero()) {
            operators[operatorIndex].failed = true
          } else {
            const pctBase = new BN(10).pow(new BN(18))
            const yeaPct = bnYea.mul(pctBase).div(totalVotes)
            const yeaOfTotalPowerPct = bnYea.mul(pctBase).div(bnVotingPower)
            // Mirror on-chain calculation
            // yea / votingPower > supportRequired ||
            //   (yea / totalVotes > supportRequired &&
            //    yea / votingPower > minAcceptQuorum)
            if(yeaOfTotalPowerPct.gt(bnSupportRequired) || (yeaPct.gt(bnSupportRequired) && yeaOfTotalPowerPct.gt(bnMinQuorum))){
              operators[operatorIndex].approved = true
            } else {
              operators[operatorIndex].failed = true
            }
          }
        } else if(executed === true) {
          operators[operatorIndex].approved = true
        }
      }
      return {
        ...state,
        operators
      }
    } else {
      return state
    }
  } else {
    return state
  }
}

async function executeVote(voting, state, { voteId }) {
  if(state.thisAddress){
    const { thisAddress, operators = [] } = state
    const { open, executed, supportRequired, minAcceptQuorum, yea, nay, votingPower, script } = await getVote(voting, voteId)
    if(script.includes(thisAddress.substr(2).toLowerCase())) {
      const bytes = `0x${script.slice(194)}`
      const hexLength = bytes.length-2
      const operatorIndex = operators.findIndex(operator =>
        padRight(asciiToHex(operator.name), hexLength) === bytes
      )
      if (operatorIndex !== -1) {
        operators[operatorIndex].approved = true
      }
      return {
        ...state,
        operators
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
      .subscribe(resolve, reject)
  )
}
