/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require("oups");
const querystring = require("querystring");

class QueryStringService {
    
    constructor(json) {
        if (!json) throw new UndefinedError(`json`);
        this.json = json;
    }

	parse(str) {
        const query = querystring.parse(str);
        return this.json.typed(query);
    }
}

module.exports = QueryStringService;