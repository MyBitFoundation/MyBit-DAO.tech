import React from 'react'
import styled from 'styled-components'
import { Button, Field, IconError, Text, TextInput, Info, theme } from '@aragon/ui'
import CircularProgress from '@material-ui/core/CircularProgress'
import isURL from 'validator/lib/isURL'

const initialState = {
  introField: '',
  websiteField: '',
  twitterField: '',
  facebookField: '',
  githubField: '',
  keybaseField: '',
  error: null,
  warning: null,
  loading: false,
  fileList: [],
}

class RequestPanelContent extends React.Component {
  static defaultProps = {
    onRequestConfirmation: () => {},
  }
  state = {
    ...initialState,
  }
  componentWillReceiveProps({ opened }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input is
      // on-screen before we call focus
      this.introInput && setTimeout(() => this.introInput.focus(), 0)

    }

    // Finished closing the panel, its state can be reset
    if (!opened && this.props.opened) {
      this.setState({
        ...initialState
      })
    }
  }

  processField = (field) => {
    return field.toLowerCase().replace('http://', '').replace('https://', '').replace('www.', '')
  }

  correctWebsite = (given, target) => {
    const urlArray = given.split('/')
    if(urlArray[0].includes(target)){
      return true
    } else {
      return false
    }
  }

  getUsername = (given, prefix) => {
    if(given.includes(prefix)){
      let urlArray = given.split(prefix)
      const postString = urlArray[urlArray.length-1]
      urlArray = postString.split('/')
      urlArray = urlArray[0].split('?')
      return urlArray[0]
    } else {
      return ''
    }

  }

  //Convert the file to buffer to store on IPFS
  convertToBuffer = async(reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer-using es6 syntax
    return buffer
  };

  //Take file input from user
  handleFileChange = event => {
    const fileList = []
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let arr = file.name.split('.')
    this.setState({
      type: arr[arr.length-1]
    })
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

  handleIntroChange = event => {
    this.setState({
      introField: event.target.value,
    })
  }

  handleWebsiteChange = event => {
    this.setState({
      websiteField: event.target.value,
    })
  }

  handleTwitterChange = event => {
    this.setState({
      twitterField: event.target.value,
    })
  }

  handleFacebookChange = event => {
    this.setState({
      facebookField: event.target.value,
    })
  }

  handleGitHubChange = event => {
    this.setState({
      githubField: event.target.value,
    })
  }

  handleKeybaseChange = event => {
    this.setState({
      keybaseField: event.target.value,
    })
  }

  handleSubmit = event => {
    event.preventDefault()
    const {
      introField,
      websiteField,
      twitterField,
      facebookField,
      githubField,
      keybaseField,
      buffer,
      type
    } = this.state
    const { getUser } = this.props
    //const website = this.filteredWebsite()

    const website = this.processField(websiteField)
    const twitter = this.processField(twitterField)
    const facebook = this.processField(facebookField)
    const github = this.processField(githubField)
    const keybase = this.processField(keybaseField)

    const userAccount = getUser()
    if(userAccount == '' || userAccount == undefined){
      this.setState({ error : 'Please sign in to MetaMask.' })
    } else if(buffer == undefined || type == undefined){
      this.setState({ error : 'Something went wrong. Please select select a photo again.'})
    } else if(website != '' && !isURL(website)){
      this.setState({ error : 'Website field invalid.' })
    } else if(twitter != '' && !isURL(twitter) && !this.correctWebsite(twitter, 'twitter.com')){
      this.setState({ error : 'Twitter field invalid.' })
    } else if(facebook != '' && !isURL(facebook) && !this.correctWebsite(facebook, 'facebook.com')){
      this.setState({ error : 'Facebook field invalid.' })
    } else if(github != '' && !isURL(github) && !this.correctWebsite(github, 'github.com')){
      this.setState({ error : 'GitHub field invalid.' })
    } else if(keybase != '' && !isURL(keybase) && !this.correctWebsite(keybase, 'keybase.io')){
      this.setState({ error : 'Keybase field invalid.' })
    } else {
      this.setState({
        loading: true
      })

      this.props.onRequestConfirmation({
        buffer: buffer,
        type: type,
        intro: introField,
        website: website,
        twitter: twitter,
        twitter_name: this.getUsername(twitter, 'twitter.com/').replace('@', ''),
        facebook: facebook,
        facebook_name: this.getUsername(facebook, 'facebook.com/'),
        github: github,
        github_name: this.getUsername(github, 'github.com/'),
        keybase: keybase,
        keybase_name: this.getUsername(keybase, 'keybase.io/'),
      })
    }
  }

  render() {
    const {
      introField,
      websiteField,
      twitterField,
      facebookField,
      githubField,
      keybaseField,
      error,
      warning,
      loading,
      fileList
    } = this.state

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
          <Field
            label='Upload Photo'
          >
            <p style={{marginBottom:'10px'}}>
              Photos are one of the best ways to know that you are not a bot.
              Please take a photo of yourself holding a piece of paper that displays your Ethereum address.
            </p>
            <FileInput
              message='Upload Photo'
              mode='secondary'
              onChange={this.handleFileChange}
              multiple={false}
              required={true}
            />
            <FileList>
              {fileListHTML}
            </FileList>
          </Field>
          <Field
            label='Introduce Yourself (markdown supported)'
          >
            <TextArea
              innerRef={element => (this.introInput = element)}
              value={introField}
              onChange={this.handleIntroChange}
              wide
            />
          </Field>
          <Info>
            Including social media posts that reference your Ethereum address can help ensure your identity is accepted.
          </Info>
          <br/>
          <Field
            label='Website'
          >
            <TextInput
              innerRef={element => (this.websiteInput = element)}
              value={websiteField}
              onChange={this.handleWebsiteChange}
              wide
            />
          </Field>
          <Field
            label='Twitter'
          >
            <TextInput
              innerRef={element => (this.twitterInput = element)}
              value={twitterField}
              onChange={this.handleTwitterChange}
              wide
            />
          </Field>
          <Field
            label='Facebook'
          >
            <TextInput
              innerRef={element => (this.facebookInput = element)}
              value={facebookField}
              onChange={this.handleFacebookChange}
              wide
            />
          </Field>
          <Field
            label='GitHub'
          >
            <TextInput
              innerRef={element => (this.githubInput = element)}
              value={githubField}
              onChange={this.handleGitHubChange}
              wide
            />
          </Field>
          <Field
            label='Keybase'
          >
            <TextInput
              innerRef={element => (this.keybaseInput = element)}
              value={keybaseField}
              onChange={this.handleKeybaseChange}
              wide
            />
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
          <Messages>
            {error && <ErrorMessage message={error} />}
            {warning && <WarningMessage message={warning} />}
          </Messages>
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
const Messages = styled.div`
  margin-top: 15px;
`

const WarningMessage = ({ message }) => <Info.Action>{message}</Info.Action>

const ErrorMessage = ({ message }) => (
  <Info background="rgba(251,121,121,0.06)">
    <IconError style={{ verticalAlign: 'middle'}}/>
    <Text size="small" style={{ marginLeft: '10px'}}>
      {message}
    </Text>
  </Info>
)

const Spinner = () => (
  <div style={{ width: '100%', textAlign: 'center' }}>
    <CircularProgress style={{ color: theme.accent }}/>
  </div>
)

export default RequestPanelContent
