import {Message} from 'discord.js';

export default class AbstractFilter {

    displayName : string;

    constructor(displayName : string) {
        this.displayName = displayName;
        (this : any).check = this.check.bind(this);
        (this : any).action = this.action.bind(this);
    }

    async check(message : Message) : Promise < boolean > {
        Logging.error("Check method not implemented for filter '" + this.displayName + "'");
        return false;
    }

    async action(message : Message) : Promise < void > {
        Logging.error("Action method not implemented for filter '" + this.displayName + "'");
    }
}
