// @flow

import {AbstractFilter} from '../ChatFilters';
import escapeStringRegexp from 'escape-string-regexp';
import {Message} from 'discord.js';

export default class LinkFilter extends AbstractFilter {

    domains() : Array < string > {
        return [];
    }

    async check(message : Message) : Promise < boolean > {
        const getURLRegex = (domain:string) : RegExp => {
            domain = (domain && domain.length > 0) ? escapeStringRegexp(domain) : "([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)";
            return new RegExp(".*https{0,1}:\/\/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)" + domain + ".*",'gi');
        }
        return this.domains().map(domain => getURLRegex(domain)).filter(rule => message.content.match(rule)).length > 0;
    }

}
