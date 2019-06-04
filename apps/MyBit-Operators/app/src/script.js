import Aragon, { events } from '@aragon/api'
import { bytesEqual } from './web3-utils'
import eventsAbi from './abi/events.json'

const app = new Aragon()

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
  app.call('getEvents').subscribe(initialize, err => {
    console.error(
      'Could not start background script execution due to the contract not loading the events address:',
      err
    )
    retry()
  })
})

async function initialize(eventsAddress) {
  const eventsContract = app.external(eventsAddress, eventsAbi)

  function reducer(state, { event, returnValues }) {
    const nextState = {
      ...state,
    }
    console.log('Event: ', event)
    switch (event) {
      case events.SYNC_STATUS_SYNCING:
        return { ...nextState, isSyncing: true }
      case events.SYNC_STATUS_SYNCED:
        return { ...nextState, isSyncing: false }
      case 'NewRequest':
        return newRequest(nextState, returnValues)
      /*case 'NewOperator':
        return newOperator(nextState, returnValues)
      case 'LogOperator':
        return operatorEvent(nextState, returnValues)*/
      default:
        return nextState
    }
  }

  const storeOptions = {
    externals: [{ contract: eventsContract }],
    init: initState(),
  }
  return app.store(reducer, storeOptions)
}

function initState() {
  return async cachedState => {
    app.identify('Operators')

    let operators = []
    if(cachedState && cachedState.operators){
      operators = cachedState.operators
    } 

    const initialState = {
      ...cachedState,
      operators: operators,
      isSyncing: true,
    }
    return initialState
  }
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/
function newRequest(state, { operatorID, name, operatorAddress, referrerAddress, ipfs, assetType }) {
  console.log('new requests')
  const { operators = [] } = state

  const operatorsIndex = operators.findIndex(operator =>
    bytesEqual(operator.id, operatorID)
  )

  if (operatorIndex === -1) {
    // If we can't find it, concat
    operators.push({
      id: operatorID,
      name: name,
      address: operatorAddress,
      referrer: referrerAddress,
      ipfs: ipfs,
      assetType: assetType,
      proposed: false,
      confirmed: false,
      removed: false
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

function operatorEvent(state, { message, messageID, operatorID, operatorURI, account, origin }) {
  if(message == "Operator removed") {
    const { operators = [] } = state

    const operatorsIndex = operators.findIndex(operator =>
      bytesEqual(operator.id, operatorID)
    )

    if (operatorIndex !== -1) {
      operators[operatorIndex].removed = true
    }
  }

  return {
    ...state,
    operators
  }
}
