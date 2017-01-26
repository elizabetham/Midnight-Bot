// @flow
//Dependencies
import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import moment from 'moment';
import _ from 'lodash';
import {Row, Col} from 'react-bootstrap';
import {Card, CardText, CardTitle} from 'material-ui';

import StatisticsActions from '../actions/StatisticsActions';
import StatisticsStore from '../stores/StatisticsStore';

import type {$StatisticsData}
from '../types/StatisticsDataType.js';

import FetchIndicator from '../components/FetchIndicator';

class StatisticsLayout extends Component {

    constructor() {
        super();
        this.state = {
            rawData: {
                hours: [],
                days: []
            },
            fetching: true
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
        this.setState({rawData: StatisticsStore.getData(), fetching: false});
    };

    render() {

        let chartColours = ["rgba(64, 23, 109, 1)", "rgba(255, 0, 0, 1)", "rgba(0, 255, 46,1)", "#1E88E5"];

        let options = {
            hours: {
                showXLabels: 10,
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                displayFormats: {
                                    hour: 'ddd, hA'
                                },
                                max: moment().startOf('hour'),
                                showXLabels: 10
                            },
                            showXLabels: 10
                        }
                    ]
                }
            },
            days: {
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'ddd, Do'
                                },
                                max: moment().startOf('day')
                            }
                        }
                    ]
                }
            },
            month: {
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'MMM, Do'
                                },
                                max: moment().startOf('day')
                            }
                        }
                    ]
                }
            }
        };

        let data = {
            hours: {
                labels: _.map(this.state.rawData.hours, 'key'),
                datasets: _.chain(this.state.rawData.hours).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.hours.map(v => v.values[actionType] === undefined
                            ? 0
                            : v.values[actionType]),
                        fill: false
                    }
                })
            },
            days: {
                labels: _.map(this.state.rawData.days, 'key'),
                datasets: _.chain(this.state.rawData.days).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.days.map(v => v.values[actionType] === undefined
                            ? 0
                            : v.values[actionType]),
                        fill: false
                    }
                })
            },
            month: {
                labels: _.map(this.state.rawData.month, 'key'),
                datasets: _.chain(this.state.rawData.month).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.month.map(v => v.values[actionType] === undefined
                            ? 0
                            : v.values[actionType]),
                        fill: false
                    }
                })
            }
        }

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
                <FetchIndicator visible={this.state.fetching}/>
                <Card>
                    <CardTitle title="Infraction Statistics"/>
                    <CardText>
                        <Row>
                            <Col md={12}>
                                <h2 style={style.centerText}>Last 48 hours</h2>
                                <Line data={data.hours} options={options.hours}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <h2 style={style.centerText}>Last 7 days</h2>
                                <Line data={data.days} options={options.days}/>
                            </Col>
                            <Col md={6}>
                                <h2 style={style.centerText}>Last month</h2>
                                <Line data={data.month} options={options.month}/>
                            </Col>
                        </Row>
                    </CardText>
                </Card>
            </div>
        );
    }

    state : {
        rawData: $StatisticsData,
        fetching: boolean
    }
}

export default StatisticsLayout;
