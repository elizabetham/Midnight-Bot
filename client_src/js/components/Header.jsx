import React, {Component} from 'react';
import {Nav, Navbar, NavItem, Header, Brand} from 'react-bootstrap';

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
          <NavItem>Infractions</NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default HeaderComponent;
