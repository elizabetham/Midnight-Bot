// @flow

import React, {Component} from 'react';
import {Panel} from 'react-bootstrap';
import moment from 'moment';
import type {$Infraction}
from '../types/InfractionType';

class InfractionComponent extends Component {

    props : {
        infraction: $Infraction;
    };

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
            ? "Yes"
            : "No";

        //Return JSX
        if (infraction.filter !== undefined) {
            return (
                <Panel header={panelHeader}>
                    <p>
                        <b>Timestamp:&nbsp;</b>{timestamp}
                    </p>
                    <p>
                        <b>Increased notoriety:&nbsp;</b>{increasedNotoriety}
                    </p>
                    <p>
                        <b>Filter:&nbsp;</b>{infraction.filter.displayName}
                    </p>
                    <p>
                        <b>Offending Message:</b>
                    </p>
                    <pre>{infraction.filter.triggerMessage}</pre>
                </Panel>
            );
        } else {
            return (
                <Panel header={panelHeader}>
                    <p>
                        <b>Timestamp:&nbsp;</b>{timestamp}
                    </p>
                    <p>
                        <b>Increased notoriety:&nbsp;</b>{increasedNotoriety}
                    </p>
                </Panel>
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
