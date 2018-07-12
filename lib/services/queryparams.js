/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require("oups");

class QueryParamsService {
    
    constructor(json) {
        if (!json) throw new UndefinedError(`json`);
        this.json = json;
    }

	typed(params) {
        return this.json.typed(params, "queryparams");
    }
}

module.exports = QueryParamsService;