/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Post = require("./post");

class Patch extends Post {
    constructor(giveme, route) {
        super(giveme, route);
    };
};

exports = module.exports = Patch;
