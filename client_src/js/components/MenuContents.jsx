// @flow
import React, {Component} from 'react';
import {Link} from 'react-router';

//Material-UI
import MenuItem from 'material-ui/MenuItem';
import AppBar from 'material-ui/AppBar';

//icons
import WarningIcon from 'material-ui/svg-icons/alert/warning';
import PollIcon from 'material-ui/svg-icons/social/poll';

class HeaderComponent extends Component {

    props: {
        menuToggle: Function
    }

    render() {
        return (
            <div>
                <MenuItem leftIcon={<WarningIcon />} containerElement={< Link to = '/infractions' />} primaryText="Infractions" onTouchTap={this.props.menuToggle}/>
                <MenuItem leftIcon={<PollIcon />} containerElement={< Link to = '/statistics' />} primaryText="Statistics" onTouchTap={this.props.menuToggle}/>
            </div>
        );
    }
}

export default HeaderComponent;
