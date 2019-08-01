import React from 'react'
import PropTypes from 'prop-types'
import BN from 'bn.js'
import { Badge, Main, SidePanel, SyncIndicator } from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import EmptyState from './screens/EmptyState'
import Operators from './screens/Operators'
import RequestOperatorPanelContent from './components/Panels/RequestOperatorPanelContent'
import AddAssetPanelContent from './components/Panels/AddAssetPanelContent'
import AddIcon from './components/AddIcon'
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
    ipfsURL: 'https://gateway.ipfs.io/ipfs/',
    isOperator: false,
    operatorID: ''
  }

  componentDidMount = async () => {
    loadIPFS.then((response) => {
      this.setState({
        ipfs: response.ipfs,
        ipfsURL: response.ipfsURL
      })
    })
  }

  componentDidUpdate(prevProps) {
   if (this.props.confirmed !== prevProps.confirmed || this.props.connectedAccount !== prevProps.connectedAccount) {
     this.checkForOperator()
   }
}

  handleNewRequest = ({name, email, url, description, address, referrer, docBufferArray, finBufferArray}) => {
    const { ipfs } = this.state
    const { api } = this.props
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
        api.newRequest(name, address, referrer, results[hashIndex].hash)
           .toPromise()
      })
  }

  handleNewAsset = async ({name, price, category, url, acceptCrypto, payoutCrypto, token, imgBufferArray, fileBufferArray}) => {
    const { ipfs, operatorID } = this.state
    const { api } = this.props
    let filesPromise = []
    if(fileBufferArray && fileBufferArray.length > 0){
      for(let i=0; i<fileBufferArray.length; i++){
        filesPromise.push(ipfs.add({
          path: fileBufferArray[i].name,
          content: fileBufferArray[i].buffer
        }))
      }
    }

    Promise.all(filesPromise).then(values => {
      let files = []
      if(values){
        for(let i=0; i<values.length; i++){
          files.push({
            name: fileBufferArray[i].name,
            hash: values[i][0].hash
          })
        }
      }

      let imgPromise = []
      if(imgBufferArray && imgBufferArray.length > 0){
        for(let i=0; i<imgBufferArray.length; i++){
          imgPromise.push(ipfs.add({
            path: imgBufferArray[i].name,
            content: imgBufferArray[i].buffer
          }))
        }
      }

      Promise.all(imgPromise).then(values => {
        let images = []
        if(values){
          for(let i=0; i<values.length; i++){
            images.push(values[i][0].hash)
          }
        }

        const json = JSON.stringify({
          goal: price,
          category: category,
          images: images,
          files: files,
          url: url
        }, null, 4)

        ipfs.add({
          path: 'asset.json',
          content: Buffer.from(json)
        }).then(results => {
          this.handleSidepanelClose()
          //Save request ot Ethereum (two parts -- submitProof, then requestAuthorization (which goes to a vote))
          api.addOperatorAsset(operatorID, name, results[0].hash, acceptCrypto, payoutCrypto, token)
             .toPromise()
        })
      })
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

  handleRemoveAsset = modelID => {
    const { api } = this.props
    api.removeOperatorAsset(modelID).toPromise()
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
  checkForOperator = () => {
    const { confirmed, connectedAccount } = this.props
    if(confirmed){
      const operatorIndex = confirmed.findIndex(operator =>
        addressesEqual(operator.address, connectedAccount)
      )
      if(operatorIndex !== -1) {
        this.setState({
          isOperator: true,
          operatorID: confirmed[operatorIndex].id
        })
      } else {
        this.setState({
          isOperator: false,
          operatorID: ''
        })
      }
    } else {
      this.setState({
        isOperator: false,
        operatorID: ''
      })
    }
  }
  render() {
    const {
      assets,
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
    const { sidepanelOpened, ipfs, ipfsURL, isOperator } = this.state
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
              mainButton={isOperator ? ({
                  label: 'Add Asset',
                  icon: <AddIcon />,
                  onClick: this.handleSidepanelOpen,
                }) : ({
                  label: 'Onboard Operator',
                  icon: <AddIcon />,
                  onClick: this.handleSidepanelOpen,
                })
              }
              smallViewPadding={0}
            >
              {appStateReady && (confirmed.length > 0 || proposals.length > 0 || requests.length > 0 || approved.length > 0) ? (
                <Operators
                  assets={assets}
                  confirmed={confirmed}
                  proposals={proposals}
                  requests={requests}
                  approved={approved}
                  userAccount={connectedAccount}
                  isOperator={isOperator}
                  ipfsAPI={ipfs}
                  ipfsURL={ipfsURL}
                  onOnboardOperator={this.handleOnboard}
                  onRemoveOperator={this.handleRemove}
                  onRemoveAsset={this.handleRemoveAsset}
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
              title={isOperator ? 'Add Asset' : 'Add Operator'}
              opened={sidepanelOpened}
              onClose={this.handleSidepanelClose}
            >
              {appStateReady && !isOperator && (
                <RequestOperatorPanelContent
                  opened={sidepanelOpened}
                  submitOperator={this.handleNewRequest}
                />
              )}
              {appStateReady && isOperator && (
                <AddAssetPanelContent
                  opened={sidepanelOpened}
                  submitAsset={this.handleNewAsset}
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
