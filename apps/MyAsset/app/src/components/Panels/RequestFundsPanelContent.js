import React from 'react'
import styled from 'styled-components'
import { Button, Field, IconCross, Text, TextInput, Info, theme } from '@aragon/ui'
import CircularProgress from '@material-ui/core/CircularProgress'
import { fromDecimals, toDecimals, formatBalance } from '../../utils'

// Any more and the number input field starts to put numbers in scientific notation
const MAX_INPUT_DECIMAL_BASE = 6

const initialState = {
  amountField: {
    error: null,
    warning: null,
    value: '',
  },
  descriptionField: '',
  buffer: null,
  loading: false,
  fileList: [],
}

class RequestFundsPanelContent extends React.Component {
  static defaultProps = {
    onSubmit: () => {},
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
  //Convert the file to buffer to store on IPFS
  convertToBuffer = async(reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer-using es6 syntax
    return buffer
  };
  handleAmountChange = event => {
    const { amountField } = this.state
    this.setState({
      amountField: { ...amountField, value: event.target.value },
    })
  }
  handleDescriptionChange = event => {
    this.setState({
      descriptionField: event.target.value
    })
  }
  //Take file input from user
  handleFileChange = event => {
    const fileList = []
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.convertToBuffer(reader).then(buffer => {
        fileList.push(file)
        this.setState({
          fileList,
          buffer: buffer
        })
      })
    }
  };

  handleSubmit = event => {
    event.preventDefault()
    const { descriptionField, buffer } = this.state
    this.setState({
      loading: true
    })
    this.props.onSubmit({
      amount: this.filteredAmount(),
      description: descriptionField,
      buffer: buffer,
    })
  }

  render() {
    const { amountField, descriptionField, fileList, loading } = this.state
    const { erc20Symbol, erc20Decimals } = this.props

    const minTokenStep = fromDecimals(
      '1',
      Math.min(MAX_INPUT_DECIMAL_BASE, erc20Decimals)
    )

    const errorMessage = amountField.error
    const warningMessage = amountField.warning

    let fileListHTML = "No file uploaded"
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
            title="Request funding"
            text={`Please upload a picture of your receipt with the total expenses displayed clearly
                   and submit the request with total amount of ${erc20Symbol} needed to cover the cost.`}
          />
          <Field label="Amount">
            <TextInput.Number
              value={amountField.value}
              onChange={this.handleAmountChange}
              min={minTokenStep}
              step={minTokenStep}
              required
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
              required
              wide
            />
          </Field>
          <Field>
            <FileInput
              message='Upload Receipt'
              mode='secondary'
              onChange={this.handleFileChange}
              multiple={false}
              required={true}
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
              Request Funds
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

const FileInput = ({ multiple, required, message, mode, onChange }) => (
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
      required={required}
      style={{fontSize: '100px', position: 'absolute', left: '0', top: '0', opacity: '0'}}
    />
  </div>
)

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

export default RequestFundsPanelContent
