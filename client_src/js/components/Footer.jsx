// @flow
import React, {Component} from 'react';

import {grey900} from 'material-ui/styles/colors'

import '../styles/footer.css';

class FooterComponent extends Component {

    render() {

        let style = {
            footerContainer: {
                backgroundColor: grey900
            }
        }

        return (
            <div className="footer-container" style={style.footerContainer}>
                <p>©<a href="http://bemacized.net/">BeMacized</a>
                    &nbsp;{new Date().getFullYear()}</p>
                <p>
                    <a href="https://github.com/BeMacized/Midnight-Bot">Source code @ GitHub</a>
                </p>
            </div>
        )
    }
}

export default FooterComponent;
