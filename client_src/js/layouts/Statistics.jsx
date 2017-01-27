// @flow
//Dependencies
import React, {Component} from 'react';
import moment from 'moment';
import _ from 'lodash';

//Components
import FetchIndicator from '../components/FetchIndicator';
import {Row, Col} from 'react-bootstrap';
import {Card, CardText, CardTitle, CardHeader, Avatar} from 'material-ui';
import {Line, Doughnut} from 'react-chartjs-2';

//Data & Actions
import StatisticsActions from '../actions/StatisticsActions';
import StatisticsStore from '../stores/StatisticsStore';

//Icons
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import InfoIcon from 'material-ui/svg-icons/action/info';
import UserIcon from 'material-ui/svg-icons/action/account-circle'

//Types
import type {$StatisticsData}
from '../types/StatisticsDataType.js';

//Colours
import {deepPurple700, deepPurple400, deepPurple50} from 'material-ui/styles/colors';

class StatisticsLayout extends Component {

    constructor() {
        super();
        this.state = {
            rawData: {
                hoursChart: [],
                daysChart: [],
                monthChart: [],
                infractionCount: 0,
                autoInfractionCount: 0,
                manualInfractionCount: 0,
                actionTypeChart: []
            },
            fetching: true
        }
        this.componentWillMount = this.componentWillMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.onStoreChange = this.onStoreChange.bind(this);
    }

    componentWillMount : Function;

    componentWillMount() {
        StatisticsStore.addChangeListener(this.onStoreChange);
        StatisticsActions.retrieveStatisticsData();
    }

    componentWillUnmount : Function;

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
            hoursChart: {
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                displayFormats: {
                                    hour: 'ddd, hA'
                                },
                                max: moment().startOf('hour')
                            }
                        }
                    ]
                }
            },
            daysChart: {
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
            monthChart: {
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
            },
            executorChart: {},
            actionTypeChart: {}
        };

        let data = {
            executorChart: {
                labels: this.state.fetching
                    ? []
                    : [
                        "Midnight", "Staff"
                    ],
                datasets: [
                    {
                        data: [
                            this.state.rawData.autoInfractionCount, this.state.rawData.manualInfractionCount
                        ],
                        backgroundColor: chartColours
                    }
                ]
            },
            actionTypeChart: {
                labels: _.map(this.state.rawData.actionTypeChart, 'type'),
                datasets: [
                    {
                        data: _.map(this.state.rawData.actionTypeChart, 'count'),
                        backgroundColor: chartColours
                    }
                ]
            },
            infractionCount: this.state.rawData.infractionCount,
            autoInfractionCount: this.state.rawData.autoInfractionCount,
            manualInfractionCount: this.state.rawData.manualInfractionCount,
            hoursChart: {
                labels: _.map(this.state.rawData.hoursChart, 'key'),
                datasets: _.chain(this.state.rawData.hoursChart).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.hoursChart.map(v => v.values[actionType] === undefined
                            ? 0
                            : v.values[actionType]),
                        fill: false
                    }
                })
            },
            daysChart: {
                labels: _.map(this.state.rawData.daysChart, 'key'),
                datasets: _.chain(this.state.rawData.daysChart).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.daysChart.map(v => v.values[actionType] === undefined
                            ? 0
                            : v.values[actionType]),
                        fill: false
                    }
                })
            },
            monthChart: {
                labels: _.map(this.state.rawData.monthChart, 'key'),
                datasets: _.chain(this.state.rawData.monthChart).map(v => _.keys(v.values)).flattenDeep().uniq().value().map((actionType, index) => {
                    return {
                        label: actionType,
                        borderColor: chartColours[index],
                        data: this.state.rawData.monthChart.map(v => v.values[actionType] === undefined
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
            },
            spacing: {
                height: "16px"
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
                                <h2 style={style.centerText}>Global statistics</h2>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Doughnut data={data.executorChart} options={options.executorChart}/>
                                <h3 style={style.centerText}>Issued by</h3>
                            </Col>
                            <Col md={6}>
                                <Doughnut data={data.actionTypeChart} options={options.actionTypeChart}/>
                                <h3 style={style.centerText}>Action Type</h3>
                            </Col>
                        </Row>
                        <Row style={style.spacing}/>
                        <Row>
                            <Col md={4}>
                                <Card>
                                    <CardHeader title={data.infractionCount} subtitle="Total Infractions" avatar={< Avatar icon = { < InfoIcon />
                                    }
                                    color = {
                                        deepPurple50
                                    }
                                    backgroundColor = {
                                        deepPurple700
                                    } />}/>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card>
                                    <CardHeader title={data.autoInfractionCount} subtitle="Automated Infractions" avatar={< Avatar icon = { < SettingsIcon />
                                    }
                                    color = {
                                        deepPurple50
                                    }
                                    backgroundColor = {
                                        deepPurple700
                                    } />}/>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card>
                                    <CardHeader title={data.manualInfractionCount} subtitle="Manual Infractions" avatar={< Avatar icon = { < UserIcon />
                                    }
                                    color = {
                                        deepPurple50
                                    }
                                    backgroundColor = {
                                        deepPurple700
                                    } />}/>
                                </Card>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <h2 style={style.centerText}>Last 48 hours</h2>
                                <Line data={data.hoursChart} options={options.hoursChart}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <h2 style={style.centerText}>Last 7 days</h2>
                                <Line data={data.daysChart} options={options.daysChart}/>
                            </Col>
                            <Col md={6}>
                                <h2 style={style.centerText}>Last month</h2>
                                <Line data={data.monthChart} options={options.monthChart}/>
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
