// @flow
//Dependencies
import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import moment from 'moment';
import _ from 'lodash';

import StatisticsActions from '../actions/StatisticsActions';
import StatisticsStore from '../stores/StatisticsStore';

import type {$StatisticsData}
from '../types/StatisticsDataType.js';

class StatisticsLayout extends Component {

    constructor() {
        super();
        this.state = {
            rawData: {
                hours: [],
                days: []
            }
        }
        //Bind methods
        this.onStoreChange = this.onStoreChange.bind(this);
    }

    componentWillMount() {
        StatisticsStore.addChangeListener(this.onStoreChange);
        StatisticsActions.retrieveStatisticsData();
    }

    componentWillUnmount() {
        StatisticsStore.removeChangeListener(this.onStoreChange);
    }

    onStoreChange : Function;

    onStoreChange() {
        this.setState({rawData: StatisticsStore.getData()});
    };

    render() {

        let chartColours = ["rgba(64, 23, 109, 0.5)", "rgba(255, 0, 0, 0.5)", "rgba(0, 255, 46, 0.5)"];

        let hourdata = {
            labels: _.map(this.state.rawData.hours, 'key'),
            datasets: _.chain(this.state.rawData.hours).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                return {
                    label: actionType,
                    backgroundColor: chartColours[index],
                    data: this.state.rawData.hours.map(v => v.values[actionType] === undefined
                        ? 0
                        : v.values[actionType])
                }
            })
        };

        let daydata = {
            labels: _.map(this.state.rawData.days, 'key'),
            datasets: _.chain(this.state.rawData.days).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                return {
                    label: actionType,
                    backgroundColor: chartColours[index],
                    data: this.state.rawData.days.map(v => v.values[actionType] === undefined
                        ? 0
                        : v.values[actionType])
                }
            })
        };

        const style = {
            layout: {
                padding: "48px 72px 48px 72px",
                width: "100%",
                margin: "0 auto",
                maxWidth: "1154px"
            },
            centerText: {
                textAlign: "center"
            }
        };

        return (
            <div style={style.layout}>
                <h2 style={style.centerText}>Last 48 hours</h2>
                <Line data={hourdata}/>
                <h2 style={style.centerText}>Last 7 days</h2>
                <Line data={daydata}/>
            </div>
        );
    }

    state : {
        rawData: $StatisticsData
    }
}

export default StatisticsLayout;
