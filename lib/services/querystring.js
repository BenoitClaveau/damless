/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const querystring = require("querystring");

class QueryStringService {
    
    constructor(json) {
        this.json = json;
    }

	parse(str) {
        const query = querystring.parse(str);
        return this.json.typed(query, "querystring");
    }
}

module.exports = QueryStringService;