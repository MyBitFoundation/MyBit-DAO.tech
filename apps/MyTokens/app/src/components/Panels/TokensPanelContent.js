import React from 'react'
import BN from 'bn.js'
import styled from 'styled-components'
import { Button, RadioList, Field, IconError, Text, TextInput, Info } from '@aragon/ui'
import { isAddress } from '../../web3-utils'
import { fromDecimals, toDecimals, formatBalance } from '../../utils'

// Any more and the number input field starts to put numbers in scientific notation
const MAX_INPUT_DECIMAL_BASE = 6

const initialState = {
  mode: 'lock',
  selected: 0,
  items: [],
  erc20Symbol: 'ERC-20',
  tokenSymbol: 'Voting Tokens',
  holderBalance: new BN(0),
  holderClaimed: new BN(0),
  holderLocked: new BN(0),
  actionAmount: 0,
  burnMessage: '',
  error: null,
  warning: null,
}

class TokensPanelContent extends React.Component {
  static defaultProps = {
    onUpdateTokens: () => {},
  }
  state = {
    ...initialState,
  }
  componentWillReceiveProps({ opened, mode, holderAddress }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input is
      // on-screen before we call focus
      this.messageInput && setTimeout(() => this.messageInput.focus(), 0)

      // Update holder address from the props
      this.updateHolderAddress(mode, holderAddress)
    }

    // Finished closing the panel, its state can be reset
    if (!opened && this.props.opened) {
      this.setState({ ...initialState })
    }
  }
  updateHolderAddress(mode, value) {
    const {
      tokenSymbol,
      tokenDecimalsBase,
      erc20Symbol,
      erc20DecimalsBase,
      getHolderBalance,
      getHolderClaimed,
      getHolderLocked,
      lockAmounts,
      lockIntervals,
      tokenIntervals
    } = this.props

    const holderBalance = getHolderBalance(value.trim())
    const holderClaimed = getHolderClaimed(value.trim())
    const holderLocked = getHolderLocked(value.trim())
    let items = [];
    if(mode === 'lock'){
      let amount;
      let lock;
      for(var i=0; i<lockIntervals.length; i++){
        amount = new BN(tokenIntervals[i]).sub(holderBalance.sub(holderClaimed))
        lock = new BN(lockAmounts[i]).sub(holderLocked)
        if(amount.gt(new BN(0))){
          items.push({
            title: `Lock ${formatBalance(new BN(lockAmounts[i]), erc20DecimalsBase)} ${erc20Symbol} for ${lockIntervals[i]} month${lockIntervals[i] != 1 ? 's' : ''}`,
            description: `Receive ${amount < 0 ? 0 : formatBalance(amount, tokenDecimalsBase)} ${tokenSymbol} by locking ${holderLocked.gt(new BN(0)) ? ' an additional' : ''} ${formatBalance(lock, erc20DecimalsBase)} ${erc20Symbol}`
          })
        }
      }
    }
    this.setState({
      items: items,
      erc20Symbol: erc20Symbol,
      tokenSymbol: tokenSymbol,
      holderBalance: holderBalance,
      holderClaimed: holderClaimed,
      holderLocked: holderLocked,
    })
  }
  handleChange = index => {
    const { tokenIntervals } = this.props
    const { items, holderBalance, holderClaimed } = this.state
    let amount = tokenIntervals[index] - (holderBalance-holderClaimed);
    if (amount < 0) amount = 0

    this.setState({
      selected: index,
      actionAmount: amount
    })
  }
  handleBurnMessage = event => {
    this.setState({ burnMessage: event.target.value })
  }
  handleSubmit = event => {
    event.preventDefault()
    const { mode, holderAddress, tokenIntervals } = this.props
    if(mode === 'burn'){
      const { burnMessage } = this.state
      this.props.onBurnTokens({
        address: holderAddress,
        message: burnMessage
      })
    } else {
      const { items, selected } = this.state
      const diff = tokenIntervals.length - items.length
      const index = selected + diff
      this.props.onUpdateTokens({
        mode,
        index
      })
    }
  }
  render() {
    const { items, selected, erc20Symbol, tokenSymbol, holderBalance, holderClaimed, holderLocked, burnMessage, actionAmount, error, warning } = this.state
    const { mode, tokenDecimalsBase, erc20DecimalsBase } = this.props

    const errorMessage = error
    const warningMessage = warning

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          {mode === 'lock'  && (
            <RadioList
              title="Lock Time"
              description="By locking your tokens you can increase your voting power"
              items={items}
              selected={selected}
              onChange={this.handleChange}
            />
          )}
          {mode === 'unlock'  && (
            <div>
              <Field label={`${erc20Symbol} Tokens to unlock: ${formatBalance(holderLocked, erc20DecimalsBase)}`}></Field>
              <Field label={`${tokenSymbol} Tokens burned: ${formatBalance(holderBalance.sub(holderClaimed), tokenDecimalsBase)}`}></Field>
            </div>
          )}
          {mode === 'burn'  && (
            <Field label={`Reason for burning ${formatBalance(holderBalance, tokenDecimalsBase)} ${tokenSymbol}`}>
              <TextInput
                innerRef={burnMessage => (this.messageInput = burnMessage)}
                value={burnMessage}
                onChange={this.handleBurnMessage}
                required
                wide
              />
            </Field>
          )}
          <br/>
          <Button
            mode="strong"
            type="submit"
            disabled={actionAmount === '0'}
            wide
          >
            {mode === 'burn' ? 'Burn' : (mode === 'lock' ? 'Lock' : 'Unlock')}
          </Button>
          <Messages>
            {errorMessage && <ErrorMessage message={errorMessage} />}
            {warningMessage && <WarningMessage message={warningMessage} />}
          </Messages>
        </form>
      </div>
    )
  }
}

const Messages = styled.div`
  margin-top: 15px;
`

const WarningMessage = ({ message }) => <Info.Action>{message}</Info.Action>

const ErrorMessage = ({ message }) => (
  <Info background="rgba(251,121,121,0.06)"><IconError />
    <Text size="small" style={{ marginLeft: '10px' }}>
      {message}
    </Text>
  </Info>
)

export default TokensPanelContent
