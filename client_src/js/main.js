import React from 'react';
import ReactDOM from 'react-dom';
import Root from './layouts/Root.jsx';
import {browserHistory} from 'react-router';

ReactDOM.render(
  <Root history={browserHistory}/>, document.getElementById('app'));
