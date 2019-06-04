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

class App extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object,
    isSyncing: PropTypes.bool,
  }

  static defaultProps = {
    appStateReady: false,
    isSyncing: true,
    operators: [],
    connectedAccount: '',
    groupMode: false,
  }

  state = {
    sidepanelOpened: false,
  }

  getHolderBalance = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.balance : new BN('0')
  }

  handleNewRequest = ({name, address, referrer, assetType}) => {
    const { api } = this.props
    const ipfs = 'ipfs'
    api.newRequest(name, address, referrer, ipfs, assetType)
       .toPromise()
       .then(function(tx){
         console.log(tx)
       })

    this.handleSidepanelClose()
  }

  handleOnboard = operatorID => {
    const { api } = this.props
    api.onboardOperator(operatorID).toPromise()
  }

  handleRemove = operatorID => {
    const { api } = this.props
    api.revokeOperator(operatorID).toPromise()
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
      isSyncing,
      connectedAccount,
      requestMenu,
    } = this.props
    const { sidepanelOpened } = this.state

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
              {appStateReady && operators.length > 0 ? (
                <Operators
                  operators={operators}
                  userAccount={connectedAccount}
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
