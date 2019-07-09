import React from 'react'
import styled from 'styled-components'
import { Button, Field, Radio, RadioGroup, IconCross, Text, TextInput, Info, SafeLink } from '@aragon/ui'
import { isAddress } from '../../web3-utils'
import { fromDecimals, toDecimals, formatBalance } from '../../utils'

// Any more and the number input field starts to put numbers in scientific notation
const MAX_INPUT_DECIMAL_BASE = 6
const WITHHOLD_OPTIONS = {
  'no': false,
  'yes': true
}
const WITHHOLD_LABELS = ['Yes', 'No']
const NETWORK_NAMES = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  31225871: 'private.'
}

const initialState = {
  managerField: {
    error: null,
    warning: null,
    value: '',
  },
  amountField: {
    error: null,
    warning: null,
    value: 0,
    max: '',
  },
  withholdActive: 'no'
}

class ChangePanelContent extends React.Component {
  static defaultProps = {
    onSubmit: () => {},
  }
  state = {
    ...initialState,
  }
  _managerInput = React.createRef()
  componentWillReceiveProps({ opened, managerAddress }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input is
      // on-screen before we call focus
      this._managerInput.current &&
        setTimeout(() => this._managerInput.current.focus(), 0)

      // Upadte manager address from the props
      this.updateManagerAddress(managerAddress)
    }

    // Finished closing the panel, its state can be reset
    if (!opened && this.props.opened) {
      this.setState({ ...initialState })
    }
  }
  filteredManagerAddress() {
    const { managerField } = this.state
    return managerField.value.trim()
  }
  filteredAmount() {
    const { erc20Decimals } = this.props
    const { amountField } = this.state
    if(amountField.value == 0){
      return amountField.value
    } else {
      return toDecimals(amountField.value.trim(), erc20Decimals)
    }
  }
  async updateManagerAddress(value) {
    const {
      erc20DecimalsBase,
      erc20Decimals,
      erc20Symbol,
      getERC20Balance,
    } = this.props

    const managerBalance = await getERC20Balance(value.trim())
    console.log('Manager balance: ', managerBalance)

    this.setState(({ managerField, amountField }) => ({
      managerField: { ...managerField, value, error: null },
      amountField: {
        ...amountField,
        max: formatBalance(managerBalance, erc20DecimalsBase, erc20Decimals),
        warning:
          managerBalance.isZero() && (
            `
              This address does not have any ${erc20Symbol} to spend on collateral.
            `
          )
      },
    }))
  }
  handleAmountChange = event => {
    const { amountField } = this.state
    this.setState({
      amountField: { ...amountField, value: event.target.value },
    })
  }
  handleManagerChange = event => {
    this.updateManagerAddress(event.target.value)
  }
  handleWithholdChange = id => {
    this.setState({
      withholdActive: id
    })
  }
  handleSubmit = event => {
    event.preventDefault()
    const managerAddress = this.filteredManagerAddress()
    console.log('Manager address: ', managerAddress)
    const managerError = !isAddress(managerAddress)
      ? `
        Manager must be a valid Ethereum address.
      `
      : null

    // Error
    if (managerError) {
      this.setState(({ managerField }) => ({
        managerField: { ...managerField, error: managerError },
      }))
      return
    }

    this.props.onSubmit({
      amount: this.filteredAmount(),
      manager: managerAddress,
      withhold: WITHHOLD_OPTIONS[this.state.withholdActive]
    })
  }
  render() {
    const { managerField, amountField, withholdActive } = this.state
    const { erc20Symbol, erc20Decimals, escrowContract, network } = this.props

    const minTokenStep = fromDecimals(
      '1',
      Math.min(MAX_INPUT_DECIMAL_BASE, erc20Decimals)
    )

    const errorMessage = managerField.error || amountField.error
    const warningMessage = managerField.warning || amountField.warning

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <Info.Action title="Replace Asset Manager">
            {`This action will propose replacing the asset manager with another user.
              The new asset manger must approve the escrow contract to transfer
              the same amount of ${erc20Symbol} as submitted by this form. Failure to
              do so will prevent the vote from being executed.`}
          </Info.Action>
          {NETWORK_NAMES[network.id] && (
            <div css="margin-top: 10px">
              <Info.Action>
                <SafeLink href={`https://${NETWORK_NAMES[network.id]}etherscan.io/address/${escrowContract}`} target='_blank'>
                  Escrow Contract
                </SafeLink>
              </Info.Action>
            </div>
          )}
          <br/>
          <Field
            label={`
              New Manager (must be a valid Ethereum address)
            `}
          >
            <TextInput
              ref={this._managerInput}
              value={managerField.value}
              onChange={this.handleManagerChange}
              required
              wide
            />
          </Field>

          <Field label={`Escrow Amount (${erc20Symbol})`}>
            <TextInput.Number
              value={amountField.value}
              onChange={this.handleAmountChange}
              max={amountField.max}
              disabled={amountField.max === '0'}
              step={minTokenStep}
              required
              wide
            />
          </Field>
          <Field label="Withhold current manager's escrow until successful transfer of asset?">
            <RadioGroup onChange={this.handleWithholdChange} selected={withholdActive}>
              {WITHHOLD_LABELS.map((label, i) => {
                const radioId = label.toLowerCase()
                return (
                  <label key={i}>
                    {label}
                    <Radio id={radioId} css='margin-right:20px'/>
                  </label>
                )
              })}
            </RadioGroup>
          </Field>
          <Button
            mode="strong"
            type="submit"
            disabled={amountField.max === '0'}
            wide
          >
            Propose
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
  <div css="margin-bottom: 10px">
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

export default ChangePanelContent
