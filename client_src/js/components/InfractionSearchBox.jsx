// @flow
import React, {Component} from 'react';

//Components
import SuggestionBox from './SuggestionBox.jsx';

//Types
import type {$User}
from '../types/UserType';

class InfractionSearchBoxComponent extends Component {

    constructor() {
        super();
        this.state = {
            searchFocused: false
        };
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
    }

    handleSearchChange : Function;

    handleSearchChange(event : SyntheticInputEvent) {
        this.props.onSearchChange(event.target.value);
    };

    onBlur : Function;

    onBlur() {
        this.setState(Object.assign({}, this.state, {searchFocused: false}));
    };

    onFocus : Function;

    onFocus() {
        this.setState(Object.assign({}, this.state, {searchFocused: true}));
    };

    render() {
        const self = this;

        let inputStyle = {
            width: "100%"
        };

        let blockStyle = {
            borderBottom: ".05rem solid #e5e5e5",
            paddingBottom: "1.5rem",
            marginBottom: "1.5rem"
        };

        let suggestions = this.props.fetchingData
            ? [
                {
                    displayText: "Searching..."
                }
            ]
            : this.props.searchResults.map(r => {
                return {
                    displayText: r.username + " (" + r.userid + ")"
                }
            });

        let suggestionsVisible = this.props.fetchingData || (this.props.searchResults.length > 0 && this.state.searchFocused);

        return (
            <div style={blockStyle}>
                <h2>Username or ID:</h2>
                <input type="text" className="form-control" value={this.props.searchValue} style={inputStyle} onChange={this.handleSearchChange} onFocus={this.onFocus} onBlur={this.onBlur}/>
                <SuggestionBox visible={suggestionsVisible} suggestions={suggestions}/>
            </div>
        );
    }

    //types
    state : {
        searchFocused: boolean
    }

    props : {
        searchResults: Array < $User >,
        onSearchChange: Function,
        searchValue: string,
        fetchingData: boolean
    }

}

export default InfractionSearchBoxComponent;
