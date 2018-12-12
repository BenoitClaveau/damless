/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const IsItForMe = require("isitforme");

class MyIsItForMe extends IsItForMe {
    
    constructor(json) {
        super();
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