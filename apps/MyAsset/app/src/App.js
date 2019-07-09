import React from 'react'
import PropTypes from 'prop-types'
import BN from 'bn.js'
import { Badge, Main, SidePanel, SyncIndicator } from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import EmptyState from './screens/EmptyState'
import Holders from './screens/Holders'
import ChangePanelContent from './components/Panels/ChangePanelContent'
import ContributePanelContent from './components/Panels/ContributePanelContent'
import RequestFundsPanelContent from './components/Panels/RequestFundsPanelContent'
import AssignTokensIcon from './components/AssignTokensIcon'
import AppLayout from './components/AppLayout'
import { addressesEqual } from './web3-utils'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'
import loadIPFS from './ipfs'
import { Buffer } from 'ipfs-http-client'
import erc20Abi from './abi/standardToken.json'

const panelTitle = {
  'change' : 'Propose New Asset Manager',
  'contribute' : 'Contribute Funds',
  'request' : 'Request Funds For New Expense'
}
class App extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object,
    isSyncing: PropTypes.bool,
  }
  static defaultProps = {
    appStateReady: false,
    isSyncing: false,
    holders: [],
    connectedAccount: '',
    proposals: [],
    requests: [],
    approved: [],
    fundingGoal:new BN(0),
    fundingProgress: new BN(0),
  }
  state = {
    mode: 'change',
    proposedManager: '',
    sidepanelOpened: false,
    ipfs: null,
    ipfsURL: 'https://gateway.ipfs.io/ipfs/',
  }

  componentDidMount = async () => {
    loadIPFS.then((response) => {
      this.setState({
        ipfs: response.ipfs,
        ipfsURL: response.ipfsURL
      })
    })
  }

  getHolderBalance = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.balance : new BN('0')
  }

  getERC20Balance = async (address) => {
    const { api, erc20Address } = this.props
    const erc20 = api.external(erc20Address, erc20Abi)
    const amount = await erc20.balanceOf(address).toPromise
    return new BN(amount)
  }

  handleRequest = ({ amount, description, buffer }) => {
    const { api } = this.props
    const { ipfs } = this.state
    const files = [
      {
        path: '/folder/description',
        content: Buffer.from(description)
      },
      {
        path: '/folder/receipt',
        content: buffer
      }
    ]
    ipfs.add(files)
      .then(results => {
        const hashIndex = results.findIndex(ipfsObject => ipfsObject.path === "folder")
        this.handleSidepanelClose()
        api.requestFunds(amount, results[hashIndex].hash).toPromise()
      })
  }
  handleChange = ({manager, amount, withhold}) => {
    const { api } = this.props
    api.replaceManager(manager, amount, withhold).toPromise()
    this.handleSidepanelClose()
  }
  handleContribute = amount => {
    const { api } = this.props
    api.contribute(amount).toPromise()
    this.handleSidepanelClose()
  }
  handleProposal = requestID => {
    const { api } = this.props
    api.startFunding(requestID).toPromise()
  }
  launchChangePanel = () => {
    this.setState({
      mode: 'change',
      sidepanelOpened: true,
    })
  }
  launchContributePanel = () => {
    this.setState({
      mode: 'contribute',
      sidepanelOpened: true,
    })
  }
  launchRequestFundsPanel = () => {
    this.setState({
      mode: 'request',
      sidepanelOpened: true,
    })
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
      assetManager,
      connectedAccount,
      erc20Address,
      erc20DecimalsBase,
      erc20Name,
      erc20Symbol,
      escrowContract,
      requests,
      proposals,
      approved,
      fundingGoal,
      fundingProgress,
      holders,
      holdingContract,
      isSyncing,
      numData,
      network,
      tokenAddress,
      tokenDecimalsBase,
      tokenName,
      tokenSupply,
      tokenSymbol,
      tokenIncome,
      tokenTransfersEnabled,
      requestMenu,
    } = this.props

    const { mode, proposedManager, sidepanelOpened, ipfs, ipfsURL } = this.state

    return (
      <Main assetsUrl="./aragon-ui">
        <div css="min-width: 320px">
          <IdentityProvider
            onResolve={this.handleResolveLocalIdentity}
            onShowLocalIdentityModal={this.handleShowLocalIdentityModal}
          >
            <SyncIndicator visible={isSyncing} />
            <AppLayout
              title="MyAsset"
              afterTitle={tokenSymbol && <Badge.App>{tokenSymbol}</Badge.App>}
              onMenuOpen={requestMenu}
              mainButton={assetManager !== connectedAccount ? ({
                  label: 'Change Manager',
                  icon: <AssignTokensIcon />,
                  onClick: this.launchChangePanel,
                }) : ({
                  label: 'Request Funding',
                  icon: <AssignTokensIcon />,
                  onClick: this.launchRequestFundsPanel,
                })
              }
              smallViewPadding={0}
            >
              {appStateReady && holders.length > 0 ? (
                <Holders
                  assetManager={assetManager}
                  holders={holders}
                  holdingContract={holdingContract}
                  requests={requests}
                  proposals={proposals}
                  approved={approved}
                  fundingGoal={fundingGoal}
                  fundingProgress={fundingProgress}
                  tokenAddress={tokenAddress}
                  tokenDecimalsBase={tokenDecimalsBase}
                  tokenName={tokenName}
                  tokenSupply={tokenSupply}
                  tokenSymbol={tokenSymbol}
                  tokenIncome={tokenIncome}
                  tokenTransfersEnabled={tokenTransfersEnabled}
                  erc20Address={erc20Address}
                  erc20DecimalsBase={erc20DecimalsBase}
                  erc20Name={erc20Name}
                  erc20Symbol={erc20Symbol}
                  userAccount={connectedAccount}
                  ipfsAPI={ipfs}
                  ipfsURL={ipfsURL}
                  onContribute={this.launchContributePanel}
                  onCreateProposal={this.handleProposal}
                />
              ) : (
                !isSyncing && (
                  <EmptyState
                    onActivate={this.handleLaunchAssignTokensNoHolder}
                  />
                )
              )}
            </AppLayout>
            <SidePanel
              title={panelTitle[mode]}
              opened={sidepanelOpened}
              onClose={this.handleSidepanelClose}
            >
              {appStateReady && mode === 'change' && (
                <ChangePanelContent
                  opened={sidepanelOpened}
                  managerAddress={proposedManager}
                  assetManager={assetManager}
                  erc20Symbol={erc20Symbol}
                  erc20Decimals={numData.erc20Decimals}
                  erc20DecimalsBase={tokenDecimalsBase}
                  escrowContract={escrowContract}
                  network={network}
                  getERC20Balance={this.getERC20Balance}
                  onSubmit={this.handleChange}
                />
              )}
              {appStateReady && mode === 'contribute' && (
                <ContributePanelContent
                  opened={sidepanelOpened}
                  erc20Symbol={erc20Symbol}
                  erc20Decimals={numData.erc20Decimals}
                  erc20DecimalsBase={erc20DecimalsBase}
                  getERC20Balance={this.getERC20Balance}
                  onSubmit={this.handleContribute}
                />
              )}
              {appStateReady && mode === 'request' && (
                <RequestFundsPanelContent
                  opened={sidepanelOpened}
                  erc20Symbol={erc20Symbol}
                  erc20Decimals={numData.erc20Decimals}
                  erc20DecimalsBase={erc20DecimalsBase}
                  onSubmit={this.handleRequest}
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
  const { api, appState, connectedAccount, requestMenu, network } = useAragonApi()
  return (
    <App
      api={api}
      connectedAccount={connectedAccount}
      requestMenu={requestMenu}
      network={network}
      {...appState}
    />
  )
}
