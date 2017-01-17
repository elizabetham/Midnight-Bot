// @flow
import React, {Component} from 'react';

class FooterComponent extends Component {

    render() {
        let style = {
            paddingTop: "1.5rem",
            color: "#777",
            borderTop: ".05rem solid #e5e5e5",
            marginTop: "1.5rem"
        }

        return (
            <footer style={style}>
                <p className="pull-left">©<a href="http://bemacized.net/">BeMacized</a>
                    &nbsp;{new Date().getFullYear()}</p>
                <p className="pull-right">
                    <a href="https://github.com/BeMacized/Midnight-Bot">Sourcecode @ GitHub</a>
                </p>
            </footer>
        )
    }
}

export default FooterComponent;
