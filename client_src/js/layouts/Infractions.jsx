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
import RefreshIndicator from 'material-ui/RefreshIndicator';

//Animations
import TransitionGroup from 'react-addons-css-transition-group';
import '../styles/infractions.css';

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
                margin: "48px 72px 48px 72px"
            },
            refresh: {
                display: 'inline-block',
                marginLeft: '50%',
                position: 'relative'
            },
            refreshContainer: {
                position: 'relative',
                height: 0,
                top: '30px'
            }
        };

        return (
            <div style={style.layout}>
                <TransitionGroup transitionName="infraction-load" transitionAppear={true} transitionAppearTimeout={200} transitionEnter={true} transitionLeave={true} transitionEnterTimeout={200} transitionLeaveTimeout={200}>
                    {this.state.fetchingData && (
                        <div style={style.refreshContainer} key="loadingInfractions">
                            <RefreshIndicator loadingColor="#FF9800" top={0} left={-25} size={50} status="loading" style={style.refresh}/>
                        </div>
                    )}
                </TransitionGroup>
                <InfractionSearchBox searchResults={this.state.searchResults} initialSearch={this.props.params.userid} onSearchChange={this.onSearchChange} fetchingData={this.state.fetchingData}/>
                <InfractionList infractions={this.state.infractions} highlightInfraction={this.props.params.infractionid}/>
            </div>
        );
    }

    state : $State;

    searchTimeout : number;
}

export default InfractionsContainer;
