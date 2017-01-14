// @flow
import React, {Component} from 'react';

class SuggestionBoxItemComponent extends Component {

    constructor() {
        super();
    }

    render() {
        return (
            <li>
                <a href="#">{this.props.displayText}</a>
            </li>
        );
    }

    //types
    props : {
        displayText: string
    }
};

export default SuggestionBoxItemComponent;
