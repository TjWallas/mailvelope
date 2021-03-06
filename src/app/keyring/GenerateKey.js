/**
 * Copyright (C) 2016 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

import React from 'react';
import PropTypes from 'prop-types';
import mvelo from '../../mvelo';
import * as l10n from '../../lib/l10n';
import {keyring} from '../app';
import moment from 'moment';

import NameAddrInput from './components/NameAddrInput';
import AdvancedExpand from './components/AdvancedExpand';
import AdvKeyGenOptions from './components/AdvKeyGenOptions';
import DefinePassword from './components/DefinePassword';
import GenerateWait from './components/GenerateWait';
import Alert from '../../components/util/Alert';

l10n.register([
  'keyring_generate_key',
  'key_gen_generate',
  'form_clear',
  'key_gen_another',
  'key_gen_upload',
  'learn_more_link',
  'alert_header_success',
  'key_gen_success'
]);

// set locale
moment.locale(navigator.language);

export default class GenerateKey extends React.Component {
  constructor(props) {
    super(props);
    this.initialState = {
      name: props.name,
      email: props.email,
      keySize: '4096',
      keyExpirationTime: null,
      password: '',
      passwordCheck: '',
      keyServerUpload: props.demail ? false : true,
      generating: false, // key generation in progress
      success: false, // key generation successful
      errors: {}, // form errors
      alert: null // notifications
    };
    this.state = this.initialState;
    this.handleChange = this.handleChange.bind(this);
    this.handleGenerate = this.handleGenerate.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.generateKey = this.generateKey.bind(this);
  }

  componentWillReceiveProps({name, email}) {
    // propagate props changes to initial state
    if (this.props.name !== name || this.props.email !== email) {
      this.setState({name, email});
    }
  }

  handleChange(event) {
    let value;
    const target = event.target;
    switch (target.type) {
      case 'checkbox':
        value = target.checked;
        break;
      default:
        value = target.value;
    }
    this.setState({[target.id]: value});
  }


  handleGenerate() {
    const validEmail = mvelo.util.checkEmail(this.state.email);
    if (!validEmail) {
      this.setState({errors: {email: new Error()}});
      return;
    }
    this.setState({generating: true});
  }

  generateKey() {
    const parameters = {};
    ({keySize: parameters.numBits, password: parameters.passphrase, keyServerUpload: parameters.uploadPublicKey} = this.state);
    parameters.userIds = [{
      fullName: this.state.name,
      email: this.state.email
    }];
    if (this.state.keyExpirationTime) {
      parameters.keyExpirationTime = Math.abs(this.state.keyExpirationTime.unix() - moment().startOf('day').unix());
    }
    keyring('generateKey', {parameters})
    .then(() => {
      this.setState({
        alert: {header: l10n.map.alert_header_success, message: l10n.map.key_gen_success, type: 'success'},
        success: true
      });
      // refresh keygrid
      this.props.onKeyringChange();
    })
    .catch(error => {
      this.setState({
        alert: {header: l10n.map.key_gen_error, message: error.message || '', type: 'danger'}
      });
    })
    .then(() => {
      this.setState({generating: false});
    });
  }

  handleReset() {
    this.setState(this.initialState);
  }

  render() {
    const validPassword = this.state.password.length && this.state.password === this.state.passwordCheck;
    return (
      <div className={this.state.generating ? 'busy' : ''}>
        <h3 className="logo-header">
          <span>{l10n.map.keyring_generate_key}</span>
        </h3>
        <form className="form" autoComplete="off">
          <NameAddrInput value={this.state} onChange={this.handleChange} disabled={this.state.success} demail={this.props.demail} />
          <AdvancedExpand>
            <AdvKeyGenOptions value={this.state} onChange={this.handleChange} disabled={this.state.success} />
          </AdvancedExpand>
          <DefinePassword value={this.state} onChange={this.handleChange} disabled={this.state.success} />
          <div className={`form-group ${this.props.demail ? 'hide' : ''}`}>
            <div className="checkbox">
              <label className="checkbox" htmlFor="keyServerUpload">
                <input checked={this.state.keyServerUpload} onChange={this.handleChange} type="checkbox" id="keyServerUpload" disabled={this.state.success} />
                <span>{l10n.map.key_gen_upload}</span>. <a href="https://keys.mailvelope.com" target="_blank" rel="noopener noreferrer">{l10n.map.learn_more_link}</a>
              </label>
            </div>
          </div>
          <div className="form-group">
            {this.state.alert && <Alert header={this.state.alert.header} message={this.state.alert.message} type={this.state.alert.type} />}
          </div>
          <div className="form-group">
            <button onClick={this.handleGenerate} type="button" className="btn btn-primary" disabled={this.state.success || !validPassword}>{l10n.map.key_gen_generate}</button>
            <button onClick={this.handleReset} type="button" className="btn btn-default" disabled={this.state.success}>{l10n.map.form_clear}</button>
            <button onClick={this.handleReset} type="button" className={`btn btn-default ${this.state.success ? '' : 'hide'}`}>{l10n.map.key_gen_another}</button>
          </div>
        </form>
        {this.state.generating && <GenerateWait onShow={this.generateKey} />}
      </div>
    );
  }
}

GenerateKey.propTypes = {
  demail: PropTypes.bool,
  name: PropTypes.string,
  email: PropTypes.string,
  onKeyringChange: PropTypes.func
};

GenerateKey.defaultProps = {
  name: '',
  email: ''
};
