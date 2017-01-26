// @flow
import React, {Component} from 'react';

import {RefreshIndicator} from 'material-ui';

//Animations
import TransitionGroup from 'react-addons-css-transition-group';
import '../../css/fetchIndicator.css';

class IndicatorComponent extends Component {

    render() {

        const style = {
            refresh: {
                display: 'inline-block',
                marginLeft: '50%',
                position: 'relative'
            },
            refreshContainer: {
                position: 'relative',
                height: 0,
                top: '30px'
            }
        };

        return (
            <TransitionGroup transitionName="fetch-indicator" transitionAppear={true} transitionAppearTimeout={200} transitionEnter={true} transitionLeave={true} transitionEnterTimeout={200} transitionLeaveTimeout={200}>
                {this.props.visible && (
                    <div style={style.refreshContainer} key="loadingInfractions">
                        <RefreshIndicator loadingColor={this.props.color || "#FF9800"} top={0} left={-25} size={50} status="loading" style={style.refresh}/>
                    </div>
                )}
            </TransitionGroup>
        )
    }

    props: {
        visible:boolean,
        color?:string
    }
}

export default IndicatorComponent;
