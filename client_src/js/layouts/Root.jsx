// @flow
//Dependencies
import React, {Component} from 'react';
import {Router, Route, IndexRoute} from 'react-router';

//Import layouts
import App from './App.jsx';
import Infractions from './Infractions.jsx';

class Root extends Component {

    render() {
        return (
            <Router history={this.props.history}>
                <Route path='/' component={App}>
                    <IndexRoute component={Infractions}/>
                </Route>
            </Router>
        );
    }
}

export default Root;
