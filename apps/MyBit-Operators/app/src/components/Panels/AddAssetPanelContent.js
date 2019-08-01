import React from 'react'
import styled from 'styled-components'
import { Button, Field, DropDown, IconError, Radio, RadioGroup, Text, TextInput, Info, theme } from '@aragon/ui'
import CircularProgress from '@material-ui/core/CircularProgress'
import { isAddress } from '../../web3-utils'
import { isEmail, isURL} from 'validator'

const CRYPTO_OPTIONS = {
  'accept_no': false,
  'accept_yes': true,
  'payout_no': false,
  'payout_yes': true
}
const CRYPTO_LABELS = ['Yes', 'No']
const TOKEN_LABELS = ['Dai', 'Eth']
const TOKEN_VALUES = ['0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', '0x0000000000000000000000000000000000000000']
const CATEGORY_LABELS = ['Crypto', 'Energy', 'Machinery', 'Real Estate', 'Transportation', 'Other']

const initialState = {
  nameField: '',
  urlField: '',
  priceField: 0,
  categoryIndex: 0,
  tokenIndex: 0,
  acceptActive: 'accept_no',
  payoutActive: 'payout_no',
  imgBufferArray: [],
  fileBufferArray: [],
  imgList: [],
  fileList: [],
  loading: false,
  error: null,
  warning: null,
}

class AddAssetPanelContent extends React.Component {
  static defaultProps = {
    submitAsset: () => {},
  }
  state = {
    ...initialState,
  }
  _nameInput = React.createRef()
  componentWillReceiveProps({ opened }) {
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

  handleNameChange = event => {
    this.setState({
      nameField: event.target.value
    })
  }

  handlePriceChange = event => {
    this.setState({
      priceField: event.target.value
    })
  }

  handleURLChange = event => {
    this.setState({
      urlField: event.target.value
    })
  }

  handleCategoryChange = index => {
    this.setState({
      categoryIndex: index
     })
  }

  handleTokenChange = index =>  {
    this.setState({
      tokenIndex: index
    })
  }

  handleAcceptChange = id => {
    this.setState({
      acceptActive: id
    })
  }

  handlePayoutChange = id => {
    this.setState({
      payoutActive: id
    })
  }

  //Take file input from user
  handleImgChange = event => {
    const imgList = []
    const imgBufferArray = []
    event.stopPropagation()
    event.preventDefault()
    for(let i=0; i<event.target.files.length; i++){
      const file = event.target.files[i]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        this.convertToBuffer(reader).then(buffer => {
          imgBufferArray.push({
            name:file.name,
            buffer: buffer
          })
        })
      }
      imgList.push(file)
    }
    this.setState({
      imgList,
      imgBufferArray
    })
  };

  //Take file input from user
  handleFileChange = event => {
    const fileList = []
    const fileBufferArray = []
    event.stopPropagation()
    event.preventDefault()
    for(let i=0; i<event.target.files.length; i++){
      const file = event.target.files[i]
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(file)
      reader.onloadend = () => {
        this.convertToBuffer(reader).then(buffer => {
          fileBufferArray.push({
            name:file.name,
            buffer: buffer
          })
        })
      }
      fileList.push(file)
    }
    this.setState({
      fileList,
      fileBufferArray
    })
  };

  handleSubmit = event => {
    event.preventDefault()
    const { nameField,
            priceField,
            urlField,
            categoryIndex,
            tokenIndex,
            acceptActive,
            payoutActive,
            imgBufferArray,
            fileBufferArray
    } = this.state
    let error

    error = (!isURL(urlField))
      ? "Website invalid"
      : error
    error = (imgBufferArray.length === 0)
      ? "Please submit at least one image"
      : error

    // Error
    if (error) {
      this.setState({
        error: error
      })
      return
    }

    this.setState({loading: true})

    this.props.submitAsset({
      name: nameField,
      price: priceField,
      url: urlField,
      category: CATEGORY_LABELS[categoryIndex],
      token: TOKEN_VALUES[tokenIndex],
      acceptCrypto: CRYPTO_OPTIONS[acceptActive],
      payoutCrypto: CRYPTO_OPTIONS[payoutActive],
      imgBufferArray: imgBufferArray,
      fileBufferArray: fileBufferArray
    })
  }

  render() {
    const {
      nameField,
      priceField,
      urlField,
      categoryIndex,
      tokenIndex,
      acceptActive,
      payoutActive,
      imgList,
      fileList,
      loading,
      error,
      warning
    } = this.state

    let imgListHTML = "No images uploaded"
    let fileListHTML = "No files uploaded"
    if(imgList.length > 0){
      imgListHTML = []
      imgList.forEach(function (file, index){
        imgListHTML.push(<li key={index}>{file.name}</li>)
      })
    }
    if(fileList.length > 0){
      fileListHTML = []
      fileList.forEach(function (file, index){
        fileListHTML.push(<li key={index}>{file.name}</li>)
      })
    }

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <InfoMessage
            title="New Asset"
            text="This action will create a new asset that gets added to the MyBit Go platform"
          />

          <Field
            label="Asset Name"
          >
            <TextInput
              ref={this._nameInput}
              value={nameField}
              onChange={this.handleNameChange}
              wide
              required
            />
          </Field>

          <Field label="Price (USD)">
            <TextInput.Number
              value={priceField}
              onChange={this.handlePriceChange}
              min='0'
              step='0.01'
              required
              wide
            />
          </Field>

          <Field
            label="Website"
          >
            <TextInput
              ref={this._urlInput}
              value={urlField}
              onChange={this.handleURLChange}
              required
              wide
            />
          </Field>
          <Field
            label="Category"
          >
            <DropDown
              items={CATEGORY_LABELS}
              active={categoryIndex}
              onChange={this.handleCategoryChange}
              wide
            />
          </Field>
          <Field
            label="Payment Token"
          >
            <DropDown
              items={TOKEN_LABELS}
              active={tokenIndex}
              onChange={this.handleTokenChange}
              wide
            />
          </Field>
          <Field label={`Can the asset be purchased with ${TOKEN_LABELS[tokenIndex]}?`}>
            <RadioGroup onChange={this.handleAcceptChange} selected={acceptActive}>
              {CRYPTO_LABELS.map((label, i) => {
                const radioId = `accept_${label.toLowerCase()}`
                return (
                  <label key={i}>
                    {label}
                    <Radio id={radioId} css='margin-right:20px'/>
                  </label>
                )
              })}
            </RadioGroup>
          </Field>
          <Field label={`Will the asset distribute income using ${TOKEN_LABELS[tokenIndex]}?`}>
            <RadioGroup onChange={this.handlePayoutChange} selected={payoutActive}>
              {CRYPTO_LABELS.map((label, i) => {
                const radioId = `payout_${label.toLowerCase()}`
                return (
                  <label key={i}>
                    {label}
                    <Radio id={radioId} css='margin-right:20px'/>
                  </label>
                )
              })}
            </RadioGroup>
          </Field>
          <Field>
            <FileInput
              message='Upload Images'
              mode='secondary'
              onChange={this.handleImgChange}
              multiple={true}
            />
            <FileList>
              {imgListHTML}
            </FileList>
          </Field>
          <Field>
            <FileInput
              message='Upload Files'
              mode='secondary'
              onChange={this.handleFileChange}
              multiple={true}
            />
            <FileList>
              {fileListHTML}
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

export default AddAssetPanelContent
