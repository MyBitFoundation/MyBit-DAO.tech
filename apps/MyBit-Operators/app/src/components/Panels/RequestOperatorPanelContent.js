import React from 'react'
import styled from 'styled-components'
import { Button, Field, DropDown, IconError, Text, TextInput, Info, theme } from '@aragon/ui'
import CircularProgress from '@material-ui/core/CircularProgress'
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
  bufferArray: [],
  fileList: [],
  activeType: 0,
  loading: false,
}

const assetTypes = [
  'Bitcoin ATM',
  'Co-Working Space',
  'Ethereum Miner',
  'Home Solar System',
  'Smart Bench',
  'Storage Unit'
]

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

  //Convert the file to buffer to store on IPFS
  convertToBuffer = async(reader) => {
    const { bufferArray } = this.state
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer-using es6 syntax
    return buffer
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

  handleAssetChange = index => {
    const { assetField } = this.state
    this.setState({
      activeType: index
    })
  }

  //Take file input from user
  handleFileChange = event => {
    const fileList = []
    const bufferArray = []
    event.stopPropagation()
    event.preventDefault()
    for(let i=0; i<event.target.files.length; i++){
      const file = event.target.files[i]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        this.convertToBuffer(reader).then(buffer => {
          bufferArray.push({
            name:file.name,
            buffer: buffer
          })
        })
      }
      fileList.push(file)
    }
    this.setState({
      fileList,
      bufferArray
    })

  };

  handleSubmit = event => {
    event.preventDefault()
    const { nameField, addressField, referrerField, activeType, bufferArray } = this.state
    const operatorAddress = this.filteredAddress(addressField.value)
    const referrerAddress = this.filteredAddress(referrerField.value)
    let operatorError, referrerError

    operatorError = !isAddress(operatorAddress)
      ? "Operator address must be a valid Ethereum address"
      : null

    referrerError = (referrerAddress != '' && !isAddress(referrerAddress))
      ? "Referrer address must be a valid Ethereum address"
      : null

    referrerError = (operatorAddress.toLowerCase() == referrerAddress.toLowerCase())
      ? "The operator cannot refer themselves"
      : referrerError

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

    this.setState({loading: true})

    // Update tokens
    this.props.submitOperator({
      name: nameField.value,
      address: operatorAddress,
      referrer: referrerAddress,
      assetType: assetTypes[activeType],
      bufferArray: bufferArray
    })
  }

  render() {
    const { nameField, addressField, referrerField, assetField, fileList, loading } = this.state

    const errorMessage = addressField.error || referrerField.error
    const warningMessage = addressField.warning || referrerField.warning

    let fileListHTML = []
    if(fileList.length > 1){
      fileList.forEach(function (file){
        fileListHTML.push(<li>{file.name}</li>)
      })
    }

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
              required
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
              required
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
            <DropDown
              items={assetTypes}
              active={this.state.activeType}
              onChange={this.handleAssetChange}
              wide
              required
            />
          </Field>
          <Field
            label='Upload Documents'
          >
            <input
              type = "file"
              onChange = {this.handleFileChange}
              multiple
            />
            {(fileList.length > 1) && (
              <FileList>
                {fileListHTML}
              </FileList>
            )}

          </Field>
          {loading ? (
            <div>
              <Spinner/>
            </div>
          ) : (
            <Button
              mode="strong"
              type="submit"
              wide
            >
              Submit
            </Button>
          )}
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
  <Info background="rgba(251,121,121,0.06)">
    <IconError style={{ verticalAlign: 'middle'}}/>
    <Text size="small" style={{ marginLeft: '10px'}}>
      {message}
    </Text>
  </Info>
)

const FileList = styled.ul`
  list-style-position: inside;
  margin-top:5px;
  padding:10px;
  background-color:${theme.infoBackground};
  border-radius:5px;
`

const Spinner = () => (
  <div style={{ width: '100%', textAlign: 'center' }}>
    <CircularProgress style={{ color: theme.accent }}/>
  </div>
)

export default RequestOperatorPanelContent
