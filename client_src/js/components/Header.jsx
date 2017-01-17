// @flow
import React, {Component} from 'react';
import {Nav, Navbar, NavItem, Header, Brand} from 'react-bootstrap';
import {Link} from 'react-router';

class HeaderComponent extends Component {

    render() {
        return (
            <Navbar default>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="#">Midnight</a>
                    </Navbar.Brand>
                </Navbar.Header>
                <Nav>
                    <NavItem>
                        <Link to="/infractions">Infractions</Link>
                    </NavItem>
                    <NavItem>
                        <Link to="/statistics">Statistics</Link>
                    </NavItem>
                </Nav>
            </Navbar>
        );
    }
}

export default HeaderComponent;
