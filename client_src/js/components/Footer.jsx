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
        <p>©<a href="http://bemacized.net/">BeMacized</a>
          &nbsp;2016-2017</p>
      </footer>
    )
  }
}

export default FooterComponent;
