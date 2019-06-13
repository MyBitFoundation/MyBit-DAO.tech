import React from 'react'
import styled from 'styled-components'
import { Button, Field, DropDown, IconError, Text, TextInput, Info, theme } from '@aragon/ui'
import CircularProgress from '@material-ui/core/CircularProgress'
import { isAddress } from '../../web3-utils'
import { isEmail, isURL} from 'validator'

const initialState = {
  nameField: '',
  emailField: '',
  urlField: '',
  descriptionField: '',
  addressField: '',
  referrerField: '',
  docBufferArray: [],
  finBufferArray: [],
  docFileList: [],
  finFileList: [],
  loading: false,
  error: null,
  warning: null,
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

  //Convert the file to buffer to store on IPFS
  convertToBuffer = async(reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer-using es6 syntax
    return buffer
  }

  filteredAddress(address) {
    return address.trim()
  }

  handleNameChange = event => {
    this.setState({
      nameField: event.target.value
    })
  }

  handleEmailChange = event => {
    this.setState({
      emailField: event.target.value
    })
  }

  handleURLChange = event => {
    this.setState({
      urlField: event.target.value
    })
  }

  handleDescriptionChange = event => {
    this.setState({
      descriptionField: event.target.value
    })
  }

  handleAddressChange = event => {
    this.setState({
      addressField: event.target.value
    })
  }

  handleReferrerChange = event => {
    this.setState({
      referrerField: event.target.value
    })
  }

  //Take file input from user
  handleDocFileChange = event => {
    const docFileList = []
    const docBufferArray = []
    event.stopPropagation()
    event.preventDefault()
    for(let i=0; i<event.target.files.length; i++){
      const file = event.target.files[i]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        this.convertToBuffer(reader).then(buffer => {
          docBufferArray.push({
            name:file.name,
            buffer: buffer
          })
        })
      }
      docFileList.push(file)
    }
    this.setState({
      docFileList,
      docBufferArray
    })
  };

  //Take file input from user
  handleFinFileChange = event => {
    const finFileList = []
    const finBufferArray = []
    event.stopPropagation()
    event.preventDefault()
    for(let i=0; i<event.target.files.length; i++){
      const file = event.target.files[i]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        this.convertToBuffer(reader).then(buffer => {
          finBufferArray.push({
            name:file.name,
            buffer: buffer
          })
        })
      }
      finFileList.push(file)
    }
    this.setState({
      finFileList,
      finBufferArray
    })
  };

  handleSubmit = event => {
    event.preventDefault()
    const { nameField, emailField, urlField, descriptionField, addressField, referrerField, docBufferArray, finBufferArray } = this.state
    const operatorAddress = this.filteredAddress(addressField)
    const referrerAddress = this.filteredAddress(referrerField)
    let error

    error = !isAddress(operatorAddress)
      ? "Operator address must be a valid Ethereum address"
      : null

    error = (referrerAddress != '' && !isAddress(referrerAddress))
      ? "Referrer address must be a valid Ethereum address"
      : error

    error = (operatorAddress.toLowerCase() == referrerAddress.toLowerCase())
      ? "The operator cannot refer themselves"
      : error

    error = (urlField != '' && !isURL(urlField))
      ? "Website invalid"
      : error

    error = (!isEmail(emailField))
      ? "Email invalid"
      : error

    // Error
    if (error) {
      this.setState({
        error: error
      })
      return
    }

    this.setState({loading: true})

    this.props.submitOperator({
      name: nameField,
      email: emailField,
      url: urlField,
      description: descriptionField,
      address: operatorAddress,
      referrer: referrerAddress,
      docBufferArray: docBufferArray,
      finBufferArray: finBufferArray
    })
  }

  render() {
    const {
      nameField,
      emailField,
      urlField,
      descriptionField,
      addressField,
      referrerField,
      assetField,
      docFileList,
      finFileList,
      loading,
      error,
      warning
    } = this.state

    let docFileListHTML = "No files uploaded"
    let finFileListHTML = "No files uploaded"
    if(docFileList.length > 0){
      docFileListHTML = []
      docFileList.forEach(function (file, index){
        console.log('Index: ', index)
        docFileListHTML.push(<li key={index}>{file.name}</li>)
      })
    }
    if(finFileList.length > 0){
      finFileListHTML = []
      finFileList.forEach(function (file, index){
        finFileListHTML.push(<li key={index}>{file.name}</li>)
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
            label="Legal Name"
          >
            <TextInput
              ref={this._nameInput}
              value={nameField}
              onChange={this.handleNameChange}
              wide
              required
            />
          </Field>

          <Field
            label="Email"
          >
            <TextInput
              ref={this._emailInput}
              value={emailField}
              onChange={this.handleEmailChange}
              wide
              required
            />
          </Field>

          <Field
            label="Website"
          >
            <TextInput
              ref={this._urlInput}
              value={urlField}
              onChange={this.handleURLChange}
              wide
            />
          </Field>

          <Field
            label='Description'
          >
            <TextArea
              ref={this._descriptionInput}
              value={descriptionField}
              onChange={this.handleDescriptionChange}
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
              value={addressField}
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
              value={referrerField}
              onChange={this.handleReferrerChange}
              wide
            />
          </Field>
          <Field>
            <FileInput
              message='Upload Legal Documents'
              mode='secondary'
              onChange={this.handleDocFileChange}
              multiple={true}
            />
            <FileList>
              {docFileListHTML}
            </FileList>
          </Field>
          <Field>
            <FileInput
              message='Upload Financial Statements'
              mode='secondary'
              onChange={this.handleFinFileChange}
              multiple={true}
            />
            <FileList>
              {finFileListHTML}
            </FileList>

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
            {error && <ErrorMessage message={error} />}
            {warning && <WarningMessage message={warning} />}
          </div>
        </form>
      </div>
    )
  }
}

const TextArea = styled.textarea`
  width:100%;
  max-width:100%;
  min-width:100%;
  height:100px;
  min-height:33px;
  padding:5px 10px;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
  &:focus {
    outline: none;
    border-color: ${theme.contentBorderActive};
  }
`

const FileInput = ({ multiple, message, mode, onChange }) => (
  <div style={{ width:'100%', position: 'relative', overflow: 'hidden', display: 'inline-block'}}>
    <Button
      mode={mode}
      wide
    >
      {message}
    </Button>
    <input
      type="file"
      onChange={onChange}
      multiple={multiple}
      style={{fontSize: '100px', position: 'absolute', left: '0', top: '0', opacity: '0'}}
    />
  </div>
)

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
  margin-top:0px;
  padding:10px;
  font-style: italic;
  color:${theme.textSecondary};
  background-color:${theme.infoBackground};
  border-radius:5px;
  & li {
    font-style: normal;
  }
`

const Spinner = () => (
  <div style={{ width: '100%', textAlign: 'center' }}>
    <CircularProgress style={{ color: theme.accent }}/>
  </div>
)

export default RequestOperatorPanelContent
