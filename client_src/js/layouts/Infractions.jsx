import React, {Component} from 'react';
import {Grid, Row, Col} from 'react-bootstrap';
import InfractionSearchBox from '../components/InfractionSearchBox.jsx';

class InfractionsContainer extends Component {

  render() {
    return (
      <Row>
        <Col lg={12}>
          <InfractionSearchBox/>
        </Col>
      </Row>
    );
  }
}

export default InfractionsContainer;
