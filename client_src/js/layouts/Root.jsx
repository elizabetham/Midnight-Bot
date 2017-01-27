// @flow
//Dependencies
import React, {Component} from 'react';
import {Router, Route, IndexRedirect} from 'react-router';

//Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import midnightTheme from '../styles/midnightTheme';

//Import layouts
import App from './App';
import Infractions from './Infractions';
import Statistics from './Statistics';
import ModDocs from './ModDocs';

class Root extends Component {

    render() {
        return (
            <MuiThemeProvider muiTheme={getMuiTheme(midnightTheme)}>
                <Router history={this.props.history}>
                    <Route path='/' component={App}>
                        <IndexRedirect to="/statistics"/>
                        <Route path="/infractions(/:userid(/:infractionid))" component={Infractions}/>
                        <Route path="/statistics" component={Statistics}/>
                        <Route path="/moddocs" component={ModDocs}/>
                    </Route>
                </Router>
            </MuiThemeProvider>
        );
    }
}

export default Root;
