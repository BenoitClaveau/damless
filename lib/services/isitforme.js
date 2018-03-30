/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require("oups");
const IsItForMe = require("isitforme");

class MyIsItForMe extends IsItForMe {
    
    constructor(json) {
        super();
        if (!json) throw new UndefinedError(`json`);
        this.json = json;
    }

    /**
	 * Overriden default reviver
	 */
	reviver(route, key, value) {
        return this.json.reviver(key, value);
    }
}

module.exports = MyIsItForMe;