// @flow
//Dependencies
import React, {Component} from 'react';

//Stores
import InfractionStore from '../stores/InfractionStore';

//Action creators
import InfractionActions from '../actions/InfractionActions';

//Types
import type {$Infraction}
from '../types/InfractionType'
import type {$User}
from '../types/UserType';

//Components
import {Grid, Row, Col} from 'react-bootstrap';
import InfractionSearchBox from '../components/InfractionSearchBox.jsx';
import InfractionList from '../components/InfractionList.jsx';

type $State = {
    infractions: Array < $Infraction >,
    searchResults: Array < $User >,
    showMessage: boolean,
    message: string,
    searchValue: string,
    fetchingData: boolean
};

class InfractionsContainer extends Component {

    constructor() {
        super();
        this.state = {
            infractions: [],
            searchResults: [],
            message: "Enter a username or user ID above to view their infractions",
            showMessage: true,
            searchValue: "",
            fetchingData: false
        }
        //Bind methods
        this.onStoreChange = this.onStoreChange.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
    }

    componentWillMount() {
        InfractionStore.addChangeListener(this.onStoreChange);
    }

    componentWillUnmount() {
        InfractionStore.removeChangeListener(this.onStoreChange);
    }

    onStoreChange : Function;

    onStoreChange() {
        //Check if we need to show a message
        let message;
        if (InfractionStore.isFetchingData()) {
            message = "Searching...";
        } else if (InfractionStore.getInfractions().length == 0 && InfractionStore.getUserSearchResults().length == 1) {
            message = InfractionStore.getUserSearchResults()[0].username + " has not received any infractions yet!";
        } else if (InfractionStore.getUserSearchResults().length == 0 && this.state.searchValue.length > 0) {
            message = "No users have been found with this name or ID";
        }

        //Construct & set the new state
        const newState = Object.assign({}, this.state, {
            infractions: InfractionStore.getInfractions(),
            searchResults: InfractionStore.getUserSearchResults(),
            showMessage: Boolean(message),
            message: message
                ? message
                : "",
            fetchingData: InfractionStore.isFetchingData()
        });
        this.setState(newState);
    };

    onSearchChange : Function;

    onSearchChange(query : string) {
        //Set the searchValue on the state so we can re-render it
        this.setState(Object.assign({}, this.state, {
            searchValue: query,
            fetchingData: true
        }));

        //Dispatch action to search for the user
        InfractionActions.searchUser(query);
    };

    render() {

        let messageStyle = {
            textAlign: "center"
        };

        return (
            <Row>
                <Col lg={12}>
                    <InfractionSearchBox searchResults={this.state.searchResults} fetchingData={this.state.fetchingData} onSearchChange={this.onSearchChange} searchValue={this.state.searchValue}/>
                    <div style={messageStyle}>{this.state.showMessage && <h2>{this.state.message}</h2>}</div>
                    < InfractionList infractions={this.state.infractions}/>
                </Col>
            </Row>
        );
    }

    state : $State;
}

export default InfractionsContainer;
