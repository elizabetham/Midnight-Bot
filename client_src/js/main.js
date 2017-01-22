// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import Root from './layouts/Root.jsx';
import {hashHistory} from 'react-router';

//Global css
import 'normalize.css/normalize.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/yeti/bootstrap.min.css';
import '../css/global.css';

//Font
import 'roboto-npm-webfont';



//React tap fix for material ui
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

ReactDOM.render(
    <Root history={hashHistory}/>, document.getElementById('app'));
