// @flow
import React, {Component} from 'react';
import Infraction from './Infraction.jsx';
import type {$Infraction}
from '../types/InfractionType';
import InfractionStore from '../stores/InfractionStore';
import InfractionActions from '../actions/InfractionActions';

class InfractionListComponent extends Component {

    constructor() {
        super();
    }

    render() {
        let infractionListItems = this.props.infractions.map((infraction : $Infraction) => <Infraction key={infraction._id} infraction={infraction}/>);

        return (
            <div>
                {infractionListItems}
            </div>
        );
    }

    //Type references
    props : {
        infractions: Array < $Infraction >
    };
}

export default InfractionListComponent;
