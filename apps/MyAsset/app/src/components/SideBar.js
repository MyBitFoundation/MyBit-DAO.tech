import React from 'react'
import BN from 'bn.js'
import styled from 'styled-components'
import { Button, ProgressBar, TokenBadge, Text, breakpoint, theme } from '@aragon/ui'
import { useNetwork } from '@aragon/api-react'
import { formatBalance, stakesPercentages } from '../utils'
import You from './You'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'

const DISTRIBUTION_ITEMS_MAX = 7
const DISTRIBUTION_COLORS = [
  '#000000',
  '#57666F',
  '#028CD1',
  '#21AAE7',
  '#39CAD0',
  '#ADE9EC',
  '#80AEDC',
]

const displayedStakes = (accounts, total) => {
  return stakesPercentages(accounts.map(({ balance }) => balance), {
    total,
    maxIncluded: DISTRIBUTION_ITEMS_MAX,
  }).map((stake, index) => ({
    name: stake.index === -1 ? 'Rest' : accounts[index].address,
    stake: stake.percentage,
    color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
  }))
}

class SideBar extends React.PureComponent {
  static defaultProps = {
    holders: [],
  }
  state = {
    withdrawAvailable: new BN(0),
  }
  componentDidMount = async () => {
    const { getOwed, userAccount } = this.props
    const amount = await getOwed(userAccount)
    this.setState({withdrawAvailable:amount})
  }
  transferableLabel() {
    const { tokenTransfersEnabled } = this.props
    if (tokenTransfersEnabled === undefined) {
      return 'Unknown'
    }
    return tokenTransfersEnabled ? 'Yes' : 'No'
  }
  render() {
    const {
      assetManager,
      collateralDecimalsBase,
      collateralSymbol,
      escrowRemaining,
      holders,
      isCurrentUser,
      network,
      onContribute,
      onWithdraw,
      tokenAddress,
      tokenDecimalsBase,
      tokenSupply,
      tokenIncome,
      tokenSymbol,
      erc20Symbol,
      erc20DecimalsBase,
      userAccount,
      fundingGoal,
      fundingProgress,
      ...rest
    } = this.props
    const { withdrawAvailable } = this.state
    const stakes = displayedStakes(holders, tokenSupply)
    return (
      <Main {...rest}>
        {fundingGoal > 0 && (
          <Part>
            <h1>
              <Text color={theme.textSecondary} smallcaps>
                Funding Progress
              </Text>
            </h1>
            <ul>
              <InfoRow>
                <span>Goal</span>
                <span>:</span>
                <strong>{formatBalance(fundingGoal, erc20DecimalsBase)}</strong>
              </InfoRow>
              <ProgressBar value={fundingProgress/fundingGoal} />
              <ButtonDiv>
                <Button
                  mode="secondary"
                  onClick={onContribute}
                  wide
                >
                  Contribute
                </Button>
              </ButtonDiv>
            </ul>
          </Part>
        )}
        <Part>
          <h1>
            <Text color={theme.textSecondary} smallcaps>
              Asset Info
            </Text>
          </h1>
          <ul>
            <InfoRow>
              <span>Manager</span>
              <span>:</span>
              <LocalIdentityBadge
                entity={assetManager}
                networkType={network.type}
                connectedAccount={isCurrentUser}
              />
            </InfoRow>
            <InfoRow>
              <span>Collateral</span>
              <span>:</span>
              <strong>{formatBalance(escrowRemaining, collateralDecimalsBase)} {collateralSymbol}</strong>
            </InfoRow>
            <InfoRow>
              <span>Asset Income</span>
              <span>:</span>
              <strong>{formatBalance(tokenIncome, erc20DecimalsBase)} {erc20Symbol}</strong>
            </InfoRow>
            <InfoRow>
              <span>Available Income</span>
              <span>:</span>
              <strong>{formatBalance(withdrawAvailable, erc20DecimalsBase)} {erc20Symbol}</strong>
            </InfoRow>
            <InfoRow>
              <span>Token Supply</span>
              <span>:</span>
              <strong>{formatBalance(tokenSupply, tokenDecimalsBase)}</strong>
            </InfoRow>
            <InfoRow>
              <span>Transferable</span>
              <span>:</span>
              <strong>{this.transferableLabel()}</strong>
            </InfoRow>
            <InfoRow>
              <span>Token</span>
              <span>:</span>
              <TokenBadge
                address={tokenAddress}
                symbol={tokenSymbol}
                networkType={network.type}
              />
            </InfoRow>
            {/*Remove 'false &&' when we figure out a way of calling MiniMeToken directly*/}
            {false && withdrawAvailable > 0 && (
              <ButtonDiv>
                <Button
                  mode="secondary"
                  onClick={onWithdraw}
                  wide
                >
                  Withdraw Income
                </Button>
              </ButtonDiv>
            )}
          </ul>
        </Part>
        <Part>
          <h1>
            <Text color={theme.textSecondary} smallcaps>
              Ownership Distribution
            </Text>
          </h1>
          <Text size="large" weight="bold">
            Token Holder Stakes
          </Text>
          <StakesBar>
            {stakes.map(({ name, stake, color }) => (
              <div
                key={name}
                title={`${name}: ${stake}%`}
                style={{
                  width: `${stake}%`,
                  height: '10px',
                  background: color,
                }}
              />
            ))}
          </StakesBar>
          <ul>
            {stakes.map(({ name, stake, color }) => (
              <StakesListItem key={name}>
                <span>
                  <StakesListBullet style={{ background: color }} />
                  <LocalIdentityBadge
                    entity={name}
                    networkType={network.type}
                    connectedAccount={name === userAccount}
                  />
                  {name === userAccount && <You />}
                </span>
                <strong>{stake}%</strong>
              </StakesListItem>
            ))}
          </ul>
        </Part>
      </Main>
    )
  }
}

const Main = styled.aside`
  flex-shrink: 0;
  flex-grow: 0;
  min-height: 100%;
  margin-top: 16px;
  padding: 0 20px;

  ${breakpoint(
    'medium',
    `
      width: 260px;
      margin-left: 30px;
      margin-top: 0;
      padding: 0;
      opacity: 1;
    `
  )};
`

const Part = styled.section`
  margin-bottom: 55px;
  h1 {
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

const InfoRow = styled.li`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  list-style: none;

  > span:nth-child(1) {
    font-weight: 400;
    color: ${theme.textSecondary};
  }
  > span:nth-child(2) {
    opacity: 0;
    width: 10px;
  }
  > span:nth-child(3) {
    flex-shrink: 1;
  }
  > strong {
    text-transform: uppercase;
  }
`

const StakesBar = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  margin: 10px 0 30px;
  border-radius: 3px;
`

const StakesListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  list-style: none;

  > span:first-child {
    display: flex;
    align-items: center;
    max-width: 80%;
  }
`

const StakesListBullet = styled.span`
  width: 10px;
  height: 10px;
  margin-right: 15px;
  border-radius: 5px;
  flex-shrink: 0;
  & + span {
    flex-shrink: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`

const ButtonDiv = styled.div`
  margin-top: 20px;
  text-align: center;
`

export default props => {
  const network = useNetwork()
  return <SideBar network={network} {...props} />
}
