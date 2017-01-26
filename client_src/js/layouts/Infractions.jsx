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
import InfractionSearchBox from '../components/InfractionSearchBox.jsx';
import InfractionList from '../components/InfractionList.jsx';

import FetchIndicator from '../components/FetchIndicator';

type $State = {
    infractions: Array < $Infraction >,
    searchResults: Array < $User >,
    fetchingData: boolean
};

class InfractionsContainer extends Component {

    constructor() {
        super();
        this.state = {
            infractions: [],
            searchResults: [],
            fetchingData: false
        }

        //Bind methods
        this.componentWillMount = this.componentWillMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);

        this.onStoreChange = this.onStoreChange.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
    }

    componentWillMount : Function;

    componentWillMount() {
        InfractionStore.addChangeListener(this.onStoreChange);
        if (this.props.params.userid)
            this.onSearchChange(this.props.params.userid);
        }

    componentWillUnmount : Function;

    componentWillUnmount() {
        InfractionStore.removeChangeListener(this.onStoreChange);
    }

    onStoreChange : Function;

    onStoreChange() {

        //Construct & set the new state
        const newState = Object.assign({}, this.state, {
            infractions: InfractionStore.getInfractions(),
            searchResults: InfractionStore.getUserSearchResults(),
            fetchingData: InfractionStore.isFetchingData()
        });

        this.setState(newState);
    };

    onSearchChange : Function;

    onSearchChange(query : string) {
        //Set the searchValue on the state so we can re-render it
        if (!this.state.fetchingData)
            this.setState(Object.assign({}, this.state, {fetchingData: true}));

        //Dispatch action to search for the user
        //Delay search to lower request count with rapid typing
        if (this.searchTimeout)
            clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            InfractionActions.searchUser(query.trim());
        }, 200);
    };

    render() {

        const style = {
            layout: {
                margin: "48px 72px 48px 72px",
                maxWidth: "1154px",
                width: "100%",
                margin: "48px auto"
            }
        };

        return (
            <div style={style.layout}>
                <FetchIndicator visible={this.state.fetchingData}/>
                <InfractionSearchBox searchResults={this.state.searchResults} initialSearch={this.props.params.userid} onSearchChange={this.onSearchChange} fetchingData={this.state.fetchingData}/>
                <InfractionList infractions={this.state.infractions} highlightInfraction={this.props.params.infractionid}/>
            </div>
        );
    }

    state : $State;

    searchTimeout : number;
}

export default InfractionsContainer;
