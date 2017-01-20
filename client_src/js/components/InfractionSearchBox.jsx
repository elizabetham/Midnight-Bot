// @flow
import React, {Component} from 'react';

//Components
import {
    Card,
    CardActions,
    CardHeader,
    CardMedia,
    CardTitle,
    CardText
} from 'material-ui/Card';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import AutoComplete from 'material-ui/AutoComplete';

//Types
import type {$User}
from '../types/UserType';

class InfractionSearchBoxComponent extends Component {

    state : {
        currentInput: string
    }

    //types
    props : {
        searchResults: Array < $User >,
        onSearchChange: Function,
        initialSearch:
            ? string,
        fetchingData: boolean
    }

    constructor(props : Object) {
        super();
        this.state = {
            currentInput: props.initialSearch
                ? props.initialSearch
                : ""
        };

        this.onSearchChange = this.onSearchChange.bind(this);
    }

    onSearchChange : Function;

    onSearchChange(query : string) {
        this.state.currentInput = query;
        this.props.onSearchChange(query);
    }

    render() {
        const self = this;

        let inputStyle = {
            width: "100%"
        };

        return (
            <Card>
                <Toolbar><ToolbarTitle text="User infraction search"/></Toolbar>
                <CardText>
                    <AutoComplete searchText={this.props.initialSearch
                        ? this.props.initialSearch
                        : ""} filter={AutoComplete.fuzzyFilter} hintText="Username or user ID" dataSource={this.props.searchResults.map(user => user.username)} onUpdateInput={this.onSearchChange} floatingLabelText="Search for a user" fullWidth={true}/>
                    <p>
                        <b>{(this.state.currentInput.length > 0 && this.props.searchResults.length == 0 && !this.props.fetchingData) && "No results have been found."}</b>
                    </p>
                </CardText>

            </Card>
        );
    }

}

export default InfractionSearchBoxComponent;
