/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class QueryParamsService {
    
    constructor(json) {
        this.json = json;
    }

	typed(params) {
        return this.json.typed(params ?? {}, "queryparams");
    }
}

module.exports = QueryParamsService;