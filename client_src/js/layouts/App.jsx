// @flow
import 'bootstrap/dist/css/bootstrap.min.css';
import React, {Component} from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import {Grid, Row, Col} from 'react-bootstrap';

class AppContainer extends Component {

    render() {
        let style = {
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem"
        };

        return (
            <div className="container" style={style}>
                <Grid>
                    <Row>
                        <Col md={12}>
                            <Header/>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            {this.props.children}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Footer/>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }
}

export default AppContainer;
