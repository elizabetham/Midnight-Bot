// @flow
//Dependencies
import React, {Component} from 'react';
import {Router, Route, IndexRedirect} from 'react-router';

//Import layouts
import App from './App';
import Infractions from './Infractions';
import Statistics from './Statistics';

class Root extends Component {

    render() {
        return (
            <Router history={this.props.history}>
                <Route path='/' component={App}>
                    <IndexRedirect to="/infractions"/>
                    <Route path="/infractions" component={Infractions}/>
                    <Route path="/statistics" component={Statistics}/>
                </Route>
            </Router>
        );
    }
}

export default Root;
