import PropTypes from 'prop-types'
import React from 'react'
import { RaisedButton, FlatButton, Dialog, TextField, Toggle } from 'material-ui'
import shallowCompare from 'react-addons-shallow-compare'
import GenericDefaultService from 'shared/Models/Accounts/Generic/GenericDefaultService'
import { mailboxActions, GenericMailboxReducer, GenericDefaultServiceReducer } from 'stores/mailbox'
import validUrl from 'valid-url'

const styles = {
  introduction: {
    textAlign: 'center',
    padding: 12,
    fontSize: '110%',
    fontWeight: 'bold'
  }
}

const NAME_REF = 'name'
const URL_REF = 'url'

export default class MailboxWizardGenericConfigureScene extends React.Component {
  /* **************************************************************************/
  // Class
  /* **************************************************************************/

  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        mailboxId: PropTypes.string.isRequired
      })
    })
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.match.params.mailboxId !== nextProps.match.params.mailboxId) {
      this.setState(this.generateState(nextProps))
    }
  }

  /* **************************************************************************/
  // Data Lifecycle
  /* **************************************************************************/

  state = this.generateState(this.props)

  /**
  * Generates the state from the given props
  * @param props: the props to use
  * @return state object
  */
  generateState (props) {
    return {
      open: true,
      configureDisplayFromPage: true,
      openWindowsExternally: false,
      hasNavigationToolbar: true,
      displayNameError: null,
      serviceUrlError: null,
      displayName: '',
      serviceUrl: ''
    }
  }

  /* **************************************************************************/
  // UI Events
  /* **************************************************************************/

  /**
  * Handles the user pressing cancel
  */
  handleCancel = (evt) => {
    // The mailbox has actually already been created at this point, so remove it.
    // Ideally this shouldn't happen but because this is handled under a configuration
    // step rather than an external creation step the mailbox is created early on in
    // its lifecycle
    mailboxActions.remove(this.props.match.params.mailboxId)

    this.setState({ open: false })
    setTimeout(() => {
      window.location.hash = '/'
    }, 250)
  }

  /**
  * Handles the user pressing next
  */
  handleNext = (evt) => {
    const {
      displayName,
      serviceUrl,
      configureDisplayFromPage,
      openWindowsExternally,
      hasNavigationToolbar
    } = this.state

    let hasError = false
    const stateUpdate = {}

    // Validate
    if (!displayName) {
      hasError = true
      stateUpdate.displayNameError = 'Display name is required'
    } else {
      stateUpdate.displayNameError = null
    }
    if (!serviceUrl) {
      hasError = true
      stateUpdate.serviceUrlError = 'Website Url is required'
    } else if (!validUrl.isUri(serviceUrl)) {
      hasError = true
      stateUpdate.serviceUrlError = 'Service url is not a valid url'
    } else {
      stateUpdate.serviceUrlError = null
    }

    // Update Mailbox
    if (!hasError) {
      const mailboxId = this.props.match.params.mailboxId
      mailboxActions.reduce(mailboxId, GenericMailboxReducer.setDisplayName, displayName)
      mailboxActions.reduce(mailboxId, GenericMailboxReducer.setUsePageTitleAsDisplayName, configureDisplayFromPage)
      mailboxActions.reduce(mailboxId, GenericMailboxReducer.setUsePageThemeAsColor, configureDisplayFromPage)
      mailboxActions.reduceService(mailboxId, GenericDefaultService.type, GenericDefaultServiceReducer.setUrl, serviceUrl)
      mailboxActions.reduceService(mailboxId, GenericDefaultService.type, GenericDefaultServiceReducer.setOpenWindowsExternally, openWindowsExternally)
      mailboxActions.reduceService(mailboxId, GenericDefaultService.type, GenericDefaultServiceReducer.setHasNavigationToolbar, hasNavigationToolbar)

      // Progress wizard
      stateUpdate.open = false
      setTimeout(() => {
        window.location.hash = `/mailbox_wizard/complete/${this.props.match.params.mailboxId}`
      }, 250)
    }
    this.setState(stateUpdate)
  }

  /* **************************************************************************/
  // Rendering
  /* **************************************************************************/

  shouldComponentUpdate (nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render () {
    const {
      open,
      configureDisplayFromPage,
      openWindowsExternally,
      hasNavigationToolbar,
      displayName,
      displayNameError,
      serviceUrl,
      serviceUrlError
    } = this.state

    const actions = (
      <div>
        <FlatButton label='Cancel' onClick={this.handleCancel} />
        <RaisedButton label='Next' primary onClick={this.handleNext} />
      </div>
    )

    return (
      <Dialog
        open={open}
        contentStyle={{ width: '90%', maxWidth: 900 }}
        bodyClassName='ReactComponent-MaterialUI-Dialog-Body-Scrollbars'
        modal
        actions={actions}
        autoScrollBodyContent>
        <div style={styles.introduction}>
          Enter the web address and the name of the website you want
          to add
        </div>
        <div>
          <TextField
            ref={NAME_REF}
            fullWidth
            floatingLabelFixed
            hintText='My Website'
            floatingLabelText='Website Name'
            value={displayName}
            errorText={displayNameError}
            onChange={(evt) => this.setState({ displayName: evt.target.value })}
            onKeyDown={(evt) => {
              if (evt.keyCode === 13) {
                this.refs[URL_REF].focus()
              }
            }} />
          <TextField
            ref={URL_REF}
            fullWidth
            type='url'
            floatingLabelFixed
            hintText='https://wavebox.io'
            floatingLabelText='Website Url'
            value={serviceUrl}
            errorText={serviceUrlError}
            onChange={(evt) => this.setState({ serviceUrl: evt.target.value })}
            onKeyDown={(evt) => {
              if (evt.keyCode === 13) {
                this.handleNext(evt)
              }
            }} />
        </div>
        <br />
        <Toggle
          toggled={configureDisplayFromPage}
          label='Use Page Title & Theme to customise icon appearance'
          labelPosition='right'
          onToggle={(evt, toggled) => this.setState({ configureDisplayFromPage: toggled })} />
        <Toggle
          toggled={openWindowsExternally}
          label='Open new windows in default browser'
          labelPosition='right'
          onToggle={(evt, toggled) => this.setState({ openWindowsExternally: toggled })} />
        <Toggle
          toggled={hasNavigationToolbar}
          label='Show navigation toolbar'
          labelPosition='right'
          onToggle={(evt, toggled) => this.setState({ hasNavigationToolbar: toggled })} />
      </Dialog>
    )
  }
}
