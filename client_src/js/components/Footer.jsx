// @flow
import React, {Component} from 'react';

import {grey900} from 'material-ui/styles/colors'

class FooterComponent extends Component {

    render() {
        let style = {
            footer: {
                backgroundColor: grey900,
                width: "100%",
                padding: "20px 20px 20px 20px",
                color: "#FFF",
                bottom: 0,
                position: 'absolute'
            },
            p: {
                margin:0,
                padding:0
            }
        }

        return (
            <div style={style.footer}>
                <p className="pull-left" style={style.p}>©<a href="http://bemacized.net/">BeMacized</a>
                    &nbsp;{new Date().getFullYear()}</p>
                <p className="pull-right"  style={style.p}>
                    <a href="https://github.com/BeMacized/Midnight-Bot">Source code @ GitHub</a>
                </p>
            </div>
        )
    }
}

export default FooterComponent;
