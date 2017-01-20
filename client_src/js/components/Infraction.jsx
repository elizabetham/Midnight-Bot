// @flow

//Dependencies
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import CopyToClipboard from 'react-copy-to-clipboard';

//Material-UI
import {List, ListItem} from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import {
    Card,
    CardActions,
    CardHeader,
    CardMedia,
    CardTitle,
    CardText
} from 'material-ui/Card';
import LinkIcon from 'material-ui/svg-icons/content/link';
import Snackbar from 'material-ui/Snackbar';
import {deepPurple100} from 'material-ui/styles/colors';

//types
import type {$Infraction}
from '../types/InfractionType';

//config
import Config from '../../../config';

class InfractionComponent extends Component {

    constructor() {
        super();
        this.state = {
            copied: false,
            openSnackbar: false
        }
        this.copied = this.copied.bind(this);
        this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount : Function;

    componentDidMount() {
        if (this.props.highlighted) {
            ReactDOM.findDOMNode(this).scrollIntoView();
        }
    }

    props : {
        infraction: $Infraction,
        highlighted: boolean
    };

    state : {
        copied: boolean,
        openSnackbar: boolean
    };

    copied : Function;

    copied() {
        this.setState(Object.assign({}, this.state, {
            copied: true,
            openSnackbar: true
        }));
    }

    handleSnackbarClose : Function;

    handleSnackbarClose() {
        this.setState(Object.assign({}, this.state, {openSnackbar: false}));
    }

    render() {
        //Reference infraction
        const infraction : $Infraction = this.props.infraction;

        //Construct header
        let action = infraction.action.type;
        if (infraction.action.type === "MUTE" && infraction.action.meta !== undefined) {
            action += " (" + ((infraction.action.meta == Number.MAX_SAFE_INTEGER)
                ? "Permanent"
                : readableTime((infraction.action.meta : number))) + ")"
        }

        let panelHeader = (
            <h4>
                <b>{action}</b>
                &nbsp;-&nbsp;{this.props.infraction.username}&nbsp;({this.props.infraction.userid})
            </h4>
        )

        //Reformat data
        let timestamp : string = moment.unix(infraction.timestamp).format('MMMM Do YYYY, h:mm:ss a');
        let increasedNotoriety : string = infraction.action.increasedNotoriety
            ? "Increased notoriety"
            : "Did not increase notoriety";

        let cardTextStyle = {
            margin: 0,
            padding: 0
        };

        const style = {
            cardStyle: {
                backgroundColor: this.props.highlighted
                    ? deepPurple100
                    : "#FFF"
                }
            }

        let permalink = Config.baseURL + "/#/infractions/" + this.props.infraction.userid + "/" + this.props.infraction._id;

        //Return JSX
        if (infraction.filter !== undefined) {
            return (
                <Card initiallyExpanded={this.props.highlighted} style={style.cardStyle}>
                    <CardTitle showExpandableButton={true} actAsExpander={true} title={action} subtitle={this.props.infraction.username + " (" + this.props.infraction.userid + ")"}/>
                    <CardText expandable={true} style={cardTextStyle}>
                        <List>
                            <ListItem primaryText={timestamp} secondaryText="Timestamp"/>
                            <ListItem primaryText={increasedNotoriety} secondaryText="Notoriety"/>
                            <ListItem primaryText={infraction.filter.displayName} secondaryText="Filter"/>
                            <ListItem primaryText="Offending message:" secondaryText={< pre style = {{height:"auto"}} > {
                                infraction.filter.triggerMessage
                            } < /pre>}/>
                        </List>
                        <CardActions expandable={true} style={{
                            textAlign: "right"
                        }}>
                            <CopyToClipboard text={permalink} onCopy={this.copied}>
                                <RaisedButton label={this.state.copied
                                    ? "Copied!"
                                    : "Permalink"} secondary={true} icon={< LinkIcon />}/>
                            </CopyToClipboard>
                            <Snackbar open={this.state.openSnackbar} message={"Permalink copied to your clipboard!"} autoHideDuration={4000} onRequestClose={this.handleSnackbarClose}/>
                        </CardActions>
                    </CardText>

                </Card>
            );
        } else {
            return (
                <Card>
                    <CardTitle actAsExpander={true} title={action} subtitle={this.props.infraction.username + " (" + this.props.infraction.userid + ")"}/>
                    <CardText expandable={true} style={cardTextStyle}>
                        <List >
                            <ListItem primaryText={timestamp} secondaryText="Timestamp"/>
                            <ListItem primaryText={increasedNotoriety}/>
                        </List>
                        <CardActions expandable={true}>
                            <CopyToClipboard text={permalink} onCopy={this.copied}>
                                <RaisedButton label={this.state.copied
                                    ? "Copied!"
                                    : "Permalink"} secondary={true} icon={< LinkIcon />}/>
                            </CopyToClipboard>
                            <Snackbar open={this.state.openSnackbar} message={"Permalink copied to the clipboard!"} autoHideDuration={4000} onRequestClose={this.handleSnackbarClose}/>
                        </CardActions>
                    </CardText>
                </Card>
            );
        }
    }
}

function readableTime(seconds : number) : string {
    let numyears = Math.floor(seconds / 31536000);
    let numdays = Math.floor((seconds % 31536000) / 86400);
    let numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    let numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    let numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    let ret = "";
    if (numyears > 0)
        ret += numyears + "y ";
    if (numdays > 0)
        ret += numdays + "d ";
    if (numhours > 0)
        ret += numhours + "h ";
    if (numminutes > 0)
        ret += numminutes + "m ";
    if (numseconds > 0)
        ret += numseconds + "s ";
    return ret.trim();
};

export default InfractionComponent;
