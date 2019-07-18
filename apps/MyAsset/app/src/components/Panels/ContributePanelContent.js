import React from 'react'
import styled from 'styled-components'
import { Button, Field, IconCross, Text, TextInput, Info } from '@aragon/ui'
import { fromDecimals, toDecimals, formatBalance } from '../../utils'

// Any more and the number input field starts to put numbers in scientific notation
const MAX_INPUT_DECIMAL_BASE = 6

const initialState = {
  mode: 'assign',
  holderField: {
    error: null,
    warning: null,
    value: '',
  },
  amountField: {
    error: null,
    warning: null,
    value: '',
    max: '',
  },
}

class ContributePanelContent extends React.Component {
  static defaultProps = {
    onUpdateTokens: () => {},
  }
  state = {
    ...initialState,
  }
  _amountInput = React.createRef()
  componentWillReceiveProps({ opened, userAccount }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input is
      // on-screen before we call focus
      this._amountInput.current &&
        setTimeout(() => this._amountInput.current.focus(), 0)

      // Update holder address from the props
      this.updateUserAddress(userAccount)
    }

    // Finished closing the panel, its state can be reset
    if (!opened && this.props.opened) {
      this.setState({ ...initialState })
    }
  }
  filteredAmount() {
    const { erc20Decimals } = this.props
    const { amountField } = this.state
    return toDecimals(amountField.value.trim(), erc20Decimals)
  }
  async updateUserAddress(value) {
    const {
      erc20DecimalsBase,
      erc20Decimals,
      getERC20Balance,
    } = this.props
    console.log('Value: ', value)
    const holderBalance = await getERC20Balance(value.trim())

    this.setState(({ holderField, amountField }) => ({
      holderField: { ...holderField, value, error: null },
      amountField: {
        ...amountField,
        max: formatBalance(holderBalance, erc20DecimalsBase, erc20Decimals),
        warning: holderBalance.isZero() && ('You do not have any funds.'),
      },
    }))
  }
  handleAmountChange = event => {
    const { amountField } = this.state
    this.setState({
      amountField: { ...amountField, value: event.target.value },
    })
  }
  handleSubmit = event => {
    event.preventDefault()
    const { mode } = this.props

    this.props.onSubmit(this.filteredAmount())
  }
  render() {
    const { amountField } = this.state
    const { erc20Decimals } = this.props

    const minTokenStep = fromDecimals(
      '1',
      Math.min(MAX_INPUT_DECIMAL_BASE, erc20Decimals)
    )

    const errorMessage = amountField.error
    const warningMessage = amountField.warning

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <InfoMessage
            title="Contribute funding"
            text={`By contributing to this funding drive, you will mint asset tokens equal to your contribution.
                  Please review all receipts that have been submitted by the asset manager to verify that all expenses
                  are accurate and necessary.`}
          />
          <Field label="Amount">
            <TextInput.Number
              value={amountField.value}
              onChange={this.handleAmountChange}
              min={minTokenStep}
              max={amountField.max}
              disabled={amountField.max === '0'}
              step={minTokenStep}
              required
              wide
            />
          </Field>
          <Button
            mode="strong"
            type="submit"
            disabled={amountField.max === '0'}
            wide
          >
            Contribute
          </Button>
          <div css="margin-top: 15px">
            {errorMessage && <ErrorMessage message={errorMessage} />}
            {warningMessage && <WarningMessage message={warningMessage} />}
          </div>
        </form>
      </div>
    )
  }
}

const Message = styled.div`
  & + & {
    margin-top: 15px;
  }
`

const InfoMessage = ({ title, text }) => (
  <div css="margin-bottom: 20px">
    <Info.Action title={title}>{text}</Info.Action>
  </div>
)

const WarningMessage = ({ message }) => (
  <Message>
    <Info.Action>{message}</Info.Action>
  </Message>
)

const ErrorMessage = ({ message }) => (
  <Message>
    <p>
      <IconCross />
      <Text size="small" style={{ marginLeft: '10px' }}>
        {message}
      </Text>
    </p>
  </Message>
)

export default ContributePanelContent
