import React from 'react'
import styled from 'styled-components'
import { TabBar, Table, TableHeader, TableRow, Viewport, breakpoint } from '@aragon/ui'
import HolderRow from '../components/HolderRow'
import SideBar from '../components/SideBar'

const TABS = ['Holders', 'Token Info']

class Holders extends React.Component {
  state = {
    selectedTab: 0,
    width: undefined,
  }

  static defaultProps = {
    holders: [],
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

  render() {
    const {
      holders,
      users,
      maxAccountTokens,
      claimAmount,
      onLockTokens,
      onUnlockTokens,
      onBurnTokens,
      tokenAddress,
      tokenDecimalsBase,
      ethDecimalsBase,
      tokenName,
      tokenSupply,
      tokenSymbol,
      erc20Symbol,
      tokenTransfersEnabled,
      userAccount,
    } = this.props
    const {
      selectedTab,
      width,
    } = this.state

    return (
     <Viewport>
       {({ breakpoints }) => {
         const tabbedNavigation = width < breakpoints.medium
         const compactTable = width < breakpoints.medium

         return (
           <TwoPanels>
             <Main>
               {tabbedNavigation && (
                 <TabBarWrapper>
                   <TabBar
                     items={TABS}
                     selected={selectedTab}
                     onSelect={this.handleSelectTab}
                   />
                 </TabBarWrapper>
               )}
               <Screen selected={!tabbedNavigation || selectedTab === 0}>
                 <ResponsiveTable
                   header={
                     <TableRow>
                       <TableHeader title='Holder' />
                       <TableHeader title="Balance" align="right" />
                       <TableHeader title="" />
                     </TableRow>
                   }
                   noSideBorders={compactTable}
                 >
                   {holders.map(({ address, balance, contribution, claimed }) => (
                     <HolderRow
                       key={address}
                       address={address}
                       name={users[address]}
                       balance={balance}
                       claimed={claimed}
                       claimAmount={claimAmount}
                       isCurrentUser={userAccount && userAccount === address}
                       maxAccountTokens={claimed ? maxAccountTokens.add(claimAmount) : maxAccountTokens}
                       erc20Symbol={erc20Symbol}
                       tokenDecimalsBase={tokenDecimalsBase}
                       ethDecimalsBase={ethDecimalsBase}
                       onLockTokens={onLockTokens}
                       onUnlockTokens={onUnlockTokens}
                       onBurnTokens={onBurnTokens}
                     />
                   ))}
                 </ResponsiveTable>
               </Screen>
             </Main>
             <Screen selected={!tabbedNavigation || selectedTab === 1}>
               <ResponsiveSideBar
                 holders={holders}
                 tokenAddress={tokenAddress}
                 tokenDecimalsBase={tokenDecimalsBase}
                 tokenName={tokenName}
                 tokenSupply={tokenSupply}
                 tokenSymbol={tokenSymbol}
                 tokenTransfersEnabled={tokenTransfersEnabled}
               />
             </Screen>
           </TwoPanels>
         )
       }}
     </Viewport>
   )
 }

 handleSelectTab = index => {
   this.setState({ selectedTab: index })
 }
}

const Screen = ({ selected, children }) => selected && children

const TabBarWrapper = styled.div`
 margin-top: 16px;
 & ul {
   border-bottom: none !important;
 }
 & li {
   padding: 0 20px;
 }
`

const ResponsiveTable = styled(Table)`
 margin-top: 16px;
 ${breakpoint(
   'medium',
   `
     opacity: 1;
     margin-top: 0;
   `
 )};
`

const ResponsiveSideBar = styled(SideBar)`
 margin-top: 16px;
 ${breakpoint(
   'medium',
   `
     opacity: 1;
     margin-top: 0;
   `
 )};
`
const Main = styled.div`
  max-width: 100%;
  ${breakpoint(
    'medium',
    `
      width: 100%;
    `
  )};
`
const TwoPanels = styled.div`
  width: 100%;
  ${breakpoint(
    'medium',
    `
      display: flex;
    `
  )};
`

export default Holders
