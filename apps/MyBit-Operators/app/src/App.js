import React from 'react'
import PropTypes from 'prop-types'
import BN from 'bn.js'
import { Badge, Main, SidePanel, SyncIndicator } from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import EmptyState from './screens/EmptyState'
import Operators from './screens/Operators'
import RequestOperatorPanelContent from './components/Panels/RequestOperatorPanelContent'
import AssignTokensIcon from './components/AssignTokensIcon'
import AppLayout from './components/AppLayout'
import { addressesEqual } from './web3-utils'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'
import loadIPFS from './ipfs'
import { Buffer } from 'ipfs-http-client'

class App extends React.PureComponent {
  static defaultProps = {
    appStateReady: false,
    isSyncing: true,
    connectedAccount: '',
  }

  state = {
    sidepanelOpened: false,
    ipfs: null,
    ipfsURL: 'https://gateway.ipfs.io/ipfs/'
  }

  componentDidMount = async () => {
    loadIPFS.then((response) => {
      this.setState({
        ipfs: response.ipfs,
        ipfsURL: response.ipfsURL
      })
    })
  }

  handleNewRequest = ({name, email, url, description, address, referrer, assetType, docBufferArray, finBufferArray}) => {
    const { ipfs } = this.state
    const { api } = this.props
    console.log('Asset Type: ', assetType)
    console.log(ipfs)
    const files = []
    if(docBufferArray.length > 0){
      for(let i=0; i<docBufferArray.length; i++){
        files.push({
          path: `/folder/Documents/${docBufferArray[i].name}`,
          content: docBufferArray[i].buffer
        })
      }
    }
    if(finBufferArray.length > 0){
      for(let i=0; i<finBufferArray.length; i++){
        files.push({
          path: `/folder/Finances/${finBufferArray[i].name}`,
          content: finBufferArray[i].buffer
        })
      }
    }
    //Generate json file
    const json = JSON.stringify({
      name: name,
      email: email,
      url: url,
      description: description,
      address: address,
      referrer: referrer
    }, null, 4)

    files.push({
      path: 'folder/profile.json',
      content: Buffer.from(json)
    })

    ipfs.add(files)
      .then(results => {
        const hashIndex = results.findIndex(ipfsObject => ipfsObject.path === "folder")
        this.handleSidepanelClose()
        //Save request ot Ethereum (two parts -- submitProof, then requestAuthorization (which goes to a vote))
        api.newRequest(name, address, referrer, results[hashIndex].hash, assetType)
           .toPromise()
      })
  }

  handleOnboard = operatorName => {
    const { api } = this.props
    api.onboardOperator(operatorName).toPromise()
  }

  handleRemove = operatorName => {
    const { api } = this.props
    api.revokeOperator(operatorName).toPromise()
  }

  handleSidepanelOpen = () => {
    this.setState({ sidepanelOpened: true })
  }

  handleSidepanelClose = () => {
    this.setState({ sidepanelOpened: false })
  }
  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }
  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }
  render() {
    const {
      appStateReady,
      operators,
      confirmed,
      proposals,
      requests,
      approved,
      isSyncing,
      connectedAccount,
      requestMenu,
    } = this.props
    const { sidepanelOpened, ipfs, ipfsURL } = this.state

    return (
      <Main assetsUrl="./aragon-ui">
        <div css="min-width: 320px">
          <IdentityProvider
            onResolve={this.handleResolveLocalIdentity}
            onShowLocalIdentityModal={this.handleShowLocalIdentityModal}
          >
            <SyncIndicator visible={isSyncing} />
            <AppLayout
              title="MyBit Go"
              afterTitle="Operators"
              onMenuOpen={requestMenu}
              mainButton={{
                label: 'Onboard Operator',
                icon: <AssignTokensIcon />,
                onClick: this.handleSidepanelOpen,
              }}
              smallViewPadding={0}
            >
              {appStateReady && (confirmed.length > 0 || proposals.length > 0 || requests.length > 0 || approved.lenght > 0) ? (
                <Operators
                  confirmed={confirmed}
                  proposals={proposals}
                  requests={requests}
                  approved={approved}
                  userAccount={connectedAccount}
                  ipfsURL={ipfsURL}
                  onOnboardOperator={this.handleOnboard}
                  onRemoveOperator={this.handleRemove}
                />
              ) : (
                !isSyncing && (
                  <EmptyState
                    onActivate={this.handleSidepanelOpen}
                  />
                )
              )}
            </AppLayout>
            <SidePanel
              title='Add Operator'
              opened={sidepanelOpened}
              onClose={this.handleSidepanelClose}
            >
              {appStateReady && (
                <RequestOperatorPanelContent
                  opened={sidepanelOpened}
                  submitOperator={this.handleNewRequest}
                />
              )}
            </SidePanel>
          </IdentityProvider>
        </div>
      </Main>
    )
  }
}

export default () => {
  const { api, appState, connectedAccount, requestMenu } = useAragonApi()
  return (
    <App
      api={api}
      connectedAccount={connectedAccount}
      requestMenu={requestMenu}
      {...appState}
    />
  )
}
