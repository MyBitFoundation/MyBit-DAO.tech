import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Text,
  TabBar,
  Table,
  TableHeader,
  TableRow,
  Viewport,
  breakpoint,
  theme,
} from '@aragon/ui'
import HolderRow from '../components/HolderRow'
import ReceiptRow from '../components/ReceiptRow'
import SideBar from '../components/SideBar'

const TABS = ['Holders', 'Asset Info']

class Holders extends React.Component {
  static propTypes = {
    holders: PropTypes.array,
  }
  static defaultProps = {
    holders: [],
  }
  state = { selectedTab: 0 }

  render() {
    const {
      assetManager,
      holders,
      holdingContract,
      requests,
      proposals,
      approved,
      fundingGoal,
      fundingProgress,
      onContribute,
      onCreateProposal,
      tokenAddress,
      tokenDecimalsBase,
      tokenName,
      tokenSupply,
      tokenSymbol,
      tokenIncome,
      tokenTransfersEnabled,
      erc20Address,
      erc20DecimalsBase,
      erc20Name,
      erc20Symbol,
      userAccount,
      ipfsAPI,
      ipfsURL,
    } = this.props
    const { selectedTab } = this.state
    const test = true

    return (
      <Viewport>
        {({ below }) => {
          const tabbedNavigation = below('medium')
          const compactTable = below('medium')

          return (
            <TwoPanels>
              <Main>
                {tabbedNavigation && (
                  <TabBarWrapper>
                    <TabBar
                      items={TABS}
                      selected={selectedTab}
                      onChange={this.handleSelectTab}
                    />
                  </TabBarWrapper>
                )}
                {(!tabbedNavigation || selectedTab === 0) && (
                  <TableWrapper>
                    {requests.length > 0 && (
                      <Part>
                        <h1>
                          <Text color={theme.textSecondary} smallcaps>
                            Requests for Funding
                          </Text>
                        </h1>
                        <ResponsiveTable
                          header={
                            <TableRow>
                              <TableHeader
                                title='Description'
                                colSpan='1'
                              />
                              <TableHeader
                                title='Amount'
                                align='right'
                                colSpan='1'
                              />
                              <TableHeader />
                            </TableRow>
                          }
                          noSideBorders={compactTable}
                        >
                          {requests.map(({ requestID, receipt, amount }) => (
                            <ReceiptRow
                              key={requestID}
                              id={requestID}
                              ipfs={receipt}
                              ipfsAPI={ipfsAPI}
                              ipfsURL={ipfsURL}
                              amount={amount}
                              erc20Symbol={erc20Symbol}
                              erc20DecimalsBase={erc20DecimalsBase}
                              compact={compactTable}
                              onCreateProposal={onCreateProposal}
                            />
                          ))}
                        </ResponsiveTable>
                      </Part>
                    )}
                    {proposals.length > 0 && (
                      <Part>
                        <h1>
                          <Text color={theme.textSecondary} smallcaps>
                            Current Funding Proposals
                          </Text>
                        </h1>
                        <ResponsiveTable
                          header={
                            <TableRow>
                              <TableHeader
                                title='Description'
                                colSpan='1'
                              />
                              <TableHeader
                                title='Amount'
                                align='right'
                                colSpan='1'
                              />
                              <TableHeader />
                            </TableRow>
                          }
                          noSideBorders={compactTable}
                        >
                          {proposals.map(({ requestID, receipt, amount }) => (
                            <ReceiptRow
                              key={requestID}
                              id={requestID}
                              ipfs={receipt}
                              ipfsAPI={ipfsAPI}
                              ipfsURL={ipfsURL}
                              amount={amount}
                              erc20Symbol={erc20Symbol}
                              erc20DecimalsBase={erc20DecimalsBase}
                              compact={compactTable}
                            />
                          ))}
                        </ResponsiveTable>
                      </Part>
                    )}
                    <Part>
                      <h1>
                        <Text color={theme.textSecondary} smallcaps>
                          Asset Holders
                        </Text>
                      </h1>
                      <ResponsiveTable
                        header={
                          <TableRow>
                            <TableHeader
                              title='Holder'
                              colSpan='1'
                            />
                            <TableHeader
                              title="Balance"
                              align='right'
                              colSpan='1'
                            />
                          </TableRow>
                        }
                        noSideBorders={compactTable}
                      >
                        {holders.map(({ address, balance }) => (
                          <HolderRow
                            key={address}
                            address={address}
                            balance={balance}
                            isCurrentUser={Boolean(
                              userAccount && userAccount === address
                            )}
                            isAssetManager={Boolean(
                              assetManager && assetManager === address
                            )}
                            isHoldingContract={Boolean(
                              holdingContract && holdingContract === address
                            )}
                            tokenDecimalsBase={tokenDecimalsBase}
                            compact={compactTable}
                          />
                        ))}
                      </ResponsiveTable>
                    </Part>
                    {approved.length > 0 && (
                      <Part>
                        <h1>
                          <Text color={theme.textSecondary} smallcaps>
                            Approved Requests
                          </Text>
                        </h1>
                        <ResponsiveTable
                          header={
                            <TableRow>
                              <TableHeader
                                title='Description'
                                colSpan='1'
                              />
                              <TableHeader
                                title='Amount'
                                align='right'
                                colSpan='1'
                              />
                              <TableHeader />
                            </TableRow>
                          }
                          noSideBorders={compactTable}
                        >
                          {approved.map(({ requestID, receipt, amount }) => (
                            <ReceiptRow
                              key={requestID}
                              id={requestID}
                              ipfs={receipt}
                              ipfsAPI={ipfsAPI}
                              ipfsURL={ipfsURL}
                              amount={amount}
                              erc20Symbol={erc20Symbol}
                              erc20DecimalsBase={erc20DecimalsBase}
                              compact={compactTable}
                            />
                          ))}
                        </ResponsiveTable>
                      </Part>
                    )}
                  </TableWrapper>
                )}
              </Main>
              {(!tabbedNavigation || selectedTab === 1) && (
                <SideBar
                  assetManager={assetManager}
                  holders={holders}
                  isCurrentUser={Boolean(
                    userAccount && userAccount === assetManager
                  )}
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
                  userAccount={userAccount}
                  onContribute={onContribute}
                />
              )}
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

const TableWrapper = styled.div`
  margin-top: 16px;
  ${breakpoint(
    'medium',
    `
      margin-top: 0;
    `
  )};
`

const Part = styled.section`
  margin-bottom: 55px;
  h1 {
    ${breakpoint(
      'medium',
      `
        margin-left:0;
        margin-right:0;
      `
    )};
    margin-left:20px;
    margin-right:20px;
    margin-bottom: 15px;
    color: ${theme.textSecondary};
    text-transform: lowercase;
    line-height: 30px;
    font-variant: small-caps;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid ${theme.contentBorder};
  }
`

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
