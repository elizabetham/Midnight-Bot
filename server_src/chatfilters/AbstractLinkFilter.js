// @flow

import AbstractFilter from './AbstractFilter';
import escapeStringRegexp from 'escape-string-regexp';
import {Message} from 'discord.js';
import _ from 'lodash';

export default class AbstractLinkFilter extends AbstractFilter {

    constructor(displayName : string) {
        super(displayName);
    }

    domains() : Array < string > {
        return [];
    }

    async check(message : Message) : Promise < boolean > {
        const getURLRegex = (url : string): Array < RegExp > => {

            let domain = (url && url.length == 0)
                ? "([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.|)" //Match any domain
                : ((url.indexOf('/') == -1)
                    ? escapeStringRegexp(url)
                    : escapeStringRegexp(url.substring(0, url.indexOf('/'))));

            let uri = (url.indexOf('/') == -1)
                ? "(/|)"
                : escapeStringRegexp(url.substring(url.indexOf('/'), url.length));

            const subdomain = "[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|)\.";
            const http = "https{0,1}:\/\/";

            return [
                new RegExp(".*" + http + "(" + subdomain + "|)" + domain + uri + ".*", 'gi'),
                new RegExp(".*" +
                    "(" + subdomain + "|)" + domain + (uri == "(/|)"
                    ? "/"
                    : uri) + ".*", 'gi')
            ];
        }

        return _.flatten(this.domains().map(domain => getURLRegex(domain))).filter(rule => message.content.match(rule)).length > 0;
    }

}
