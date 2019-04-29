import React from 'react'
//import { getProfile } from '3box'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import BN from 'bn.js'
import {
  PublicUrl,
  BaseStyles,
  Viewport,
  AppView,
  AppBar,
  BreakPoint,
  SidePanel,
  Badge,
  Button,
  SafeLink,
  Info,
  font,
  observe,
} from '@aragon/ui'
import EmptyState from './screens/EmptyState'
import Holders from './screens/Holders'
import TokensPanelContent from './components/Panels/TokensPanelContent'
import MenuButton from './components/MenuButton/MenuButton'
import { networkContextType } from './provide-network'
import { erc20Settings, hasLoadedERC20Settings, hasLoadedTokenSettings } from './token-settings'
import { makeEtherscanBaseUrl } from './utils'
import { addressesEqual } from './web3-utils'
import erc20Abi from './abi/standardToken.json'


const initialLockTokensConfig = {
  mode: null,
  holderAddress: '',
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object,
    sendMessageToWrapper: PropTypes.func,
  }
  static defaultProps = {
    appStateReady: false,
    holders: [],
    network: {},
    userAccount: '',
  }
  state = {
    users: {},
    //queried: {},
    erc20Processing: false,
    erc20Loaded: false,
    erc20Symbol: 'ERC20',
    lockTokensConfig: initialLockTokensConfig,
    sidepanelOpened: false,
    width: undefined
  }

  async componentWillReceiveProps({ app, erc20Address, holders }) {
    if(!this.state.erc20Processing && erc20Address !== undefined){
      this.state.erc20Processing = true
      let erc20 = app.external(erc20Address, erc20Abi)
      let tempData = await this.loadERC20Settings(erc20)
      let erc20DecimalsBase = new BN(10).pow(new BN(tempData.erc20Decimals))
      let erc20Data = {
        ...tempData,
        erc20DecimalsBase,
        erc20Decimals: new BN(tempData.erc20Decimals),
        erc20Supply: new BN(tempData.erc20Supply)
      }
      this.setState({
        ...this.state,
        ...erc20Data,
        lockAmounts: await this.loadLockAmounts(app),
        lockIntervals: await this.loadLockIntervals(app),
        tokenIntervals: await this.loadTokenIntervals(app),
        erc20Loaded:true
      })
    }
    /* REMOVED BECAUSE 3BOX CAUSES ERRORS IN FIREFOX
    if(holders){
      let userDict = this.state.users
      let queriedDict = this.state.queried
      let promiseArray = [];
      let holderArray = [];
      holders
      .filter(({ address }) => !queriedDict[address])
      .forEach((holder) => {
        queriedDict[holder.address] = true
        userDict[holder.address] = holder.address
        this.setState({users: userDict})
        this.setState({queried: queriedDict})
        promiseArray.push(getProfile(holder.address))
        holderArray.push(holder.address)
      })
      const profiles = await Promise.all(promiseArray)
      for(var i=0; i<profiles.length; i++){
        if(profiles[i].name){
          const holderIndex = holders.findIndex(holder =>
            addressesEqual(holder.address, holderArray[i])
          )
          if(profiles[i].name != '') userDict[holders[holderIndex].address] = profiles[i].name
        }
      }
      this.setState({users: userDict})
      this.setState({queried: queriedDict})
    }
    */
  }

  updateDimensions() {
    this.setState({ width: window.innerWidth });
  }

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

  loadERC20Settings(token) {
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

  loadLockAmounts(app) {
    return new Promise((resolve, reject) =>
      app
        .call('getLockAmounts()')
        .first()
        .subscribe(resolve, reject)
    )
  }

  loadLockIntervals(app) {
    return new Promise((resolve, reject) =>
      app
        .call('getLockIntervals()')
        .first()
        .subscribe(resolve, reject)
    )
  }

  loadTokenIntervals(app) {
    return new Promise((resolve, reject) =>
      app
        .call('getTokenIntervals()')
        .first()
        .subscribe(resolve, reject)
    )
  }


  static childContextTypes = {
    network: networkContextType,
  }
  getChildContext() {
    const { network } = this.props

    return {
      network: {
        etherscanBaseUrl: makeEtherscanBaseUrl(network.type),
        type: network.type,
      },
    }
  }
  getHolderBalance = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.balance : new BN('0')
  }
  getHolderContribution = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.contribution : new BN('0')
  }
  getHolderClaimed = address => {
    const { holders, claimAmount } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? (holder.claimed ? claimAmount : new BN('0')) : new BN('0')
  }
  getHolderLocked = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    return holder ? holder.locked : new BN('0')
  }
  isClaimable = address => {
    const { holders } = this.props
    const holder = holders.find(holder =>
      addressesEqual(holder.address, address)
    )
    /*
    if (holder && holder.contribution.gt(new BN('0')) && !holder.claimed){
      return true
    } else {
      return false
    }
    */
    if (holder && holder.claimed){
      return false
    } else {
      return true
    }
  }
  handleUpdateTokens = ({ mode, index, amount}) => {
    const { app, erc20Address } = this.props
    const { lockIntervals } = this.state

    if (mode === 'lock') {
      let intentParams = {
        token: { address: erc20Address, value: amount },
        // While it's generally a bad idea to hardcode gas in intents, in the case of token deposits
        // it prevents metamask from doing the gas estimation and telling the user that their
        // transaction will fail (before the approve is mined).
        // The actual gas cost is around ~180k + 20k per 32 chars of text + 80k per period
        // transition but we do the estimation with some breathing room in case it is being
        // forwarded (unlikely in deposit).
        gas:'500000'
      }
      app.lock(lockIntervals[index], intentParams)
        .subscribe(
          txHash => {
            //console.log('Tx: ', txHash)
            this.handleSidepanelClose()
          },
          err => {
            console.error(err)
            this.handleSidepanelClose()
          })
    }
    if (mode === 'unlock') {
      app.unlock()
        .subscribe(
          txHash => {
            //console.log('Tx: ', txHash)
            this.handleSidepanelClose()
          },
          err => {
            console.error(err)
            this.handleSidepanelClose()
          })
    }
  }
  /*
  handleClaimToken = () => {
    const {app, holders, userAccount} = this.props
    const holderIndex = holders.findIndex(holder =>
      addressesEqual(holder.address, userAccount)
    )
    let day = holders[holderIndex].day
    if(day) app.claim(day)
  }
  */
  handleClaimToken = day => {
    const {app} = this.props
    if(day >= 0 && day < 365){
      app.claim(day)
        .subscribe(
          txHash => {
            //console.log('Tx: ', txHash)
            this.handleSidepanelClose()
          },
          err => {
            console.error(err)
            this.handleSidepanelClose()
          })
    }
  }
  handleBurnTokens = ({ address, message }) => {
    const { app } = this.props
    app.burn(address, message)
      .subscribe(
        txHash => {
          //console.log('Tx: ', txHash)
          this.handleSidepanelClose()
        },
        err => {
          console.error(err)
          this.handleSidepanelClose()
        })
  }
  handleLaunchLockTokens = () => {
    const { userAccount } = this.props
    this.setState({
      lockTokensConfig: { mode: 'lock', holderAddress: userAccount },
      sidepanelOpened: true,
    })
  }
  handleLaunchUnlockTokens = () => {
    const { userAccount } = this.props
    this.setState({
      lockTokensConfig: { mode: 'unlock', holderAddress: userAccount },
      sidepanelOpened: true,
    })
  }
  handleLaunchClaimToken = () => {
    const {userAccount} = this.props
    this.setState({
      lockTokensConfig: { mode: 'claim', holderAddress: userAccount },
      sidepanelOpened: true,
    })
  }
  handleLaunchBurnTokens = address => {
    this.setState({
      lockTokensConfig: { mode: 'burn', holderAddress: address },
      sidepanelOpened: true,
    })
  }
  handleMenuPanelOpen = () => {
    this.props.sendMessageToWrapper('menuPanel', true)
  }
  handleSidepanelClose = () => {
    this.setState({ sidepanelOpened: false })
  }
  render() {
    const {
      holders,
      appStateReady,
      erc20Address,
      numData,
      tokenAddress,
      tokenDecimalsBase,
      ethDecimalsBase,
      tokenName,
      tokenSupply,
      tokenSymbol,
      tokenTransfersEnabled,
      userAccount,
      claimAmount,
    } = this.props
    const {
      users,
      erc20Loaded,
      lockTokensConfig,
      sidepanelOpened,
      erc20DecimalsBase,
      erc20Symbol,
      lockAmounts,
      lockIntervals,
      tokenIntervals,
      width,
    } = this.state
    return (
      <PublicUrl.Provider url="./aragon-ui/">
        <BaseStyles />
        <Main>
          <Viewport>
            {({ breakpoints }) => (
              <AppView
                padding={width < breakpoints.medium ? 0 : 30}
                appBar={
                  <AppBar
                    title={
                    <Title>
                      <BreakPoint to="medium">
                        <MenuButton onClick={this.handleMenuPanelOpen} />
                      </BreakPoint>
                      <TitleLabel>MyTokens</TitleLabel>
                      {tokenSymbol && <Badge.App>{tokenSymbol}</Badge.App>}
                    </Title>
                  }
                  endContent={
                    <Button
                      style={{'marginLeft':'10px'}}
                      mode="strong"
                      onClick={this.handleLaunchLockTokens}
                    >
                      Lock {erc20Symbol}
                    </Button>
                  }
                />
              }
            >
              <Info.Action>
                <SafeLink href='https://medium.com/mybit-dapp/mybit-dao-tutorial-5b3bc093963b' target='_blank'>MyBit DAO tutorial</SafeLink>
              </Info.Action>
              <br />
              {appStateReady && holders.length > 0 ? (
                <Holders
                  holders={holders}
                  users={users}
                  tokenAddress={tokenAddress}
                  tokenDecimalsBase={tokenDecimalsBase}
                  ethDecimalsBase={ethDecimalsBase}
                  tokenName={tokenName}
                  tokenSupply={tokenSupply}
                  tokenSymbol={tokenSymbol}
                  erc20Symbol={erc20Symbol}
                  tokenTransfersEnabled={tokenTransfersEnabled}
                  userAccount={userAccount}
                  claimAmount={claimAmount}
                  maxAccountTokens={tokenIntervals ? new BN(tokenIntervals[tokenIntervals.length-1]) : new BN(0)}
                  onLockTokens={this.handleLaunchLockTokens}
                  onUnlockTokens={this.handleLaunchUnlockTokens}
                  onBurnTokens={this.handleLaunchBurnTokens}
                />
              ) : (
                <EmptyState onActivate={this.handleLaunchLockTokens} />
              )}
            </AppView>
            )}
          </Viewport>
          <SidePanel
            title={
              lockTokensConfig.mode === 'lock'
                ? `Lock ${erc20Symbol}`
                : (lockTokensConfig.mode === 'unlock'
                ? `Unlock ${erc20Symbol}`
                : (lockTokensConfig.mode === 'burn'
                ? 'Burn Tokens'
                : 'Claim Token'))
            }
            opened={sidepanelOpened}
            onClose={this.handleSidepanelClose}
          >
            {appStateReady && erc20Loaded && (
              <TokensPanelContent
                opened={sidepanelOpened}
                tokenSymbol={tokenSymbol}
                tokenDecimals={numData.tokenDecimals}
                tokenDecimalsBase={tokenDecimalsBase}
                erc20Address={erc20Address}
                erc20DecimalsBase={erc20DecimalsBase}
                erc20Symbol={erc20Symbol}
                onUpdateTokens={this.handleUpdateTokens}
                onBurnTokens={this.handleBurnTokens}
                onClaimToken={this.handleClaimToken}
                getHolderBalance={this.getHolderBalance}
                getHolderClaimed={this.getHolderClaimed}
                getHolderLocked={this.getHolderLocked}
                lockAmounts={lockAmounts}
                lockIntervals={lockIntervals}
                tokenIntervals={tokenIntervals}
                {...lockTokensConfig}
              />
            )}
          </SidePanel>
        </Main>
      </PublicUrl.Provider>
    )
  }
}

const Main = styled.div`
  height: 100vh;
`

const Title = styled.span`
  display: flex;
  align-items: center;
`

const TitleLabel = styled.span`
  margin-right: 10px;
  ${font({ size: 'xxlarge' })};
`

export default observe(
  // Convert tokenSupply and holders balances to BNs,
  // and calculate tokenDecimalsBase.
  observable =>
    observable.map(state => {
      const appStateReady = hasLoadedTokenSettings(state)
      if (!appStateReady) {
        return {
          ...state,
          appStateReady,
        }
      }
      const {
        holders,
        claimAmount,
        tokenDecimals,
        tokenSupply,
        tokenTransfersEnabled,
      } = state
      const tokenDecimalsBase = new BN(10).pow(new BN(tokenDecimals))
      const ethDecimalsBase = new BN(10).pow(new BN(18))
      return {
        ...state,
        appStateReady,
        tokenDecimalsBase,
        ethDecimalsBase,
        // Note that numbers in `numData` are not safe for accurate computations
        // (but are useful for making divisions easier)
        numData: {
          tokenDecimals: parseInt(tokenDecimals, 10),
          tokenSupply: parseInt(tokenSupply, 10),
        },
        holders: holders
          ? holders
              .map(holder => ({
                ...holder,
                name: holder.address,
                balance: (holder.balance ? new BN(holder.balance) : new BN(0)),
                contribution: (holder.contribution ? new BN(holder.contribution) : new BN(0)),
                locked: (holder.locked ? new BN(holder.locked) : new BN(0)),
                claimed: (holder.claimed ? holder.claimed : false)
              }))
              .filter(({ balance, contribution, claimed }) => balance.gt(new BN('0')) || (contribution.gt(new BN('0')) && !claimed))
              .sort((a, b) => b.balance.cmp(a.balance))
          : [],
        tokenDecimals: new BN(tokenDecimals),
        tokenSupply: new BN(tokenSupply),
        claimAmount: new BN(claimAmount),
      }
    }),
  {}
)(App)
