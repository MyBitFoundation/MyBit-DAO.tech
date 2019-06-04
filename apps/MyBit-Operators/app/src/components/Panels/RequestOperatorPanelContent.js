import React from 'react'
import styled from 'styled-components'
import { Button, Field, IconCross, Text, TextInput, Info } from '@aragon/ui'
import { isAddress } from '../../web3-utils'

const initialState = {
  nameField: {
    error: null,
    warning: null,
    value: '',
  },
  addressField: {
    error: null,
    warning: null,
    value: '',
  },
  referrerField: {
    error: null,
    warning: null,
    value: '',
  },
  assetField: {
    error: null,
    warning: null,
    value: '',
  },
}

class RequestOperatorPanelContent extends React.Component {
  static defaultProps = {
    onUpdateTokens: () => {},
  }
  state = {
    ...initialState,
  }
  _nameInput = React.createRef()
  componentWillReceiveProps({ opened, holderAddress }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input is
      // on-screen before we call focus
      this._nameInput.current &&
        setTimeout(() => this._nameInput.current.focus(), 0)
    }

    // Finished closing the panel, its state can be reset
    if (!opened && this.props.opened) {
      this.setState({ ...initialState })
    }
  }

  filteredAddress(address) {
    return address.trim()
  }

  handleNameChange = event => {
    const { nameField } = this.state
    this.setState({
      nameField: { ...nameField, value: event.target.value}
    })
  }

  handleAddressChange = event => {
    const {addressField } = this.state
    this.setState({
      addressField: { ...addressField, value: event.target.value}
    })
  }

  handleReferrerChange = event => {
    const { referrerField } = this.state
    this.setState({
      referrerField: { ...referrerField, value: event.target.value}
    })
  }

  handleAssetChange = event => {
    const { assetField } = this.state
    this.setState({
      assetField: { ...assetField, value: event.target.value}
    })
  }

  handleSubmit = event => {
    event.preventDefault()
    const { nameField, addressField, referrerField, assetField } = this.state
    const operatorAddress = this.filteredAddress(addressField.value)
    const referrerAddress = this.filteredAddress(referrerField.value)

    const operatorError = !isAddress(operatorAddress)
      ? "Operator address must be a valid Ethereum address"
      : null

    const referrerError = !isAddress(referrerAddress)
      ? "Referrer address must be a valid Ethereum address"
      : null

    // Error
    if (operatorError) {
      this.setState(({ addressField }) => ({
        addressField: { ...addressField, error: operatorError },
      }))
      return
    }

    // Error
    if (referrerError) {
      this.setState(({ referrerField }) => ({
        referrerField: { ...referrerField, error: referrerError },
      }))
      return
    }

    // Update tokens
    this.props.submitOperator({
      name: nameField.value,
      address: operatorAddress,
      referrer: referrerAddress,
      assetType: assetField.value,
    })
  }

  render() {
    const { nameField, addressField, referrerField, assetField } = this.state

    const errorMessage = addressField.error || referrerField.error
    const warningMessage = addressField.warning || referrerField.warning

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <InfoMessage
            title="New Request"
            text="This action will request that an operator gets added to the MyBit Go platform"
          />

          <Field
            label="Operator Name"
          >
            <TextInput
              ref={this._nameInput}
              value={nameField.value}
              onChange={this.handleNameChange}
              wide
            />
          </Field>

          <Field
            label={`
              Operator Address
              (must be a valid Ethereum address)
            `}
          >
            <TextInput
              ref={this._addressInput}
              value={addressField.value}
              onChange={this.handleAddressChange}
              wide
            />
          </Field>

          <Field
            label={`
              Referrer Address
              (must be a valid Ethereum address)
            `}
          >
            <TextInput
              ref={this._referrerInput}
              value={referrerField.value}
              onChange={this.handleReferrerChange}
              wide
            />
          </Field>

          <Field
            label="Asset Type"
          >
            <TextInput
              ref={this._assetInput}
              value={assetField.value}
              onChange={this.handleAssetChange}
              wide
            />
          </Field>

          <Button
            mode="strong"
            type="submit"
            wide
          >
            Submit
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

export default RequestOperatorPanelContent
