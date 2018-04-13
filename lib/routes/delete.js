/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Get = require("./get");

class Delete extends Get {
    constructor(giveme, route) {
        super(giveme, route);
    };
};

exports = module.exports = Delete;