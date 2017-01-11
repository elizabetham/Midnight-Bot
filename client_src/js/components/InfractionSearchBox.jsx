import React, {Component} from 'react';
import {Row, Col} from 'react-bootstrap';

class InfractionSearchBox extends Component {

  render() {
    let inputStyle = {
      width: "100%"
    };

    let blockStyle = {
      borderBottom: ".05rem solid #e5e5e5",
      paddingBottom: "1.5rem",
      marginBottom: "1.5rem"
    };

    return (
      <div style={blockStyle}>
        <h2>Username or ID:</h2>
        <input type="text" className="form-control" style={inputStyle}/>
      </div>
    );
  }
}

export default InfractionSearchBox;
