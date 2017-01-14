// @flow
import React, {Component} from 'react';
import SuggestionBoxItem from './SuggestionBoxItem';

class SuggestionBoxComponent extends Component {

    render() {
        let boxClass = (this.props.suggestions.length > 0)
            ? "dropdown open"
            : "dropdown";

        let items : Array < $JSXIntrinsics > = this.props.suggestions.map((e, index) => <SuggestionBoxItem key={index} displayText={e.displayText}/>);

        let fullStyle = (this.props.visible)
            ? {
                display: "block"
            }
            : {
                display: "none"
            }
        return (
            <div className={boxClass} style={fullStyle}>
                <ul className="dropdown-menu">
                    {items}
                </ul>
            </div>
        );

    }

    //types
    props : {
        visible: boolean,
        suggestions: Array < {
            displayText: string
        } >
    };
}

export default SuggestionBoxComponent;
SuggestionBoxComponent;
