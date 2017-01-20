// @flow
import React, {Component} from 'react';
import MenuContents from '../components/MenuContents';
import Footer from '../components/Footer';

//Material-UI
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';

class AppContainer extends Component {

    state : {
        menuOpen: boolean;
    }

    constructor() {
        super();
        this.state = {
            menuOpen: false
        };
        this.handleMenuToggle = this.handleMenuToggle.bind(this);
    }

    handleMenuToggle : Function;

    handleMenuToggle = () => this.setState(Object.assign({}, this.state, {
        menuOpen: !this.state.menuOpen
    }));

    render() {

        let style = {
            appBarStyle: {
                position: "fixed",
                top: "0px",
                zIndex: 1400,
                width: "100%"
            },
            containerStyle: {
                paddingTop: "64px"
            }
        }

        return (
            <div>
                <div style={style.appBarStyle}>
                    <AppBar title="Midnight" iconClassNameRight="muidocs-icon-navigation-expand-more" onLeftIconButtonTouchTap={this.handleMenuToggle}/>
                </div>
                <div style={style.containerStyle}>
                    <Drawer docked={false} containerStyle={style.containerStyle} open={this.state.menuOpen}>
                        <MenuContents menuToggle={this.handleMenuToggle}/>
                    </Drawer>
                    {this.props.children}
                    <Footer/>
                </div>
            </div>
        );
    }
}

export default AppContainer;
