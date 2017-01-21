// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import Root from './layouts/Root.jsx';
import {hashHistory} from 'react-router';

//Normalize.css
import 'normalize.css/normalize.css';

//Font
import 'roboto-npm-webfont';

//React tap fix for material ui
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

ReactDOM.render(
    <Root history={hashHistory}/>, document.getElementById('app'));
