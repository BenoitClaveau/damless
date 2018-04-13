/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Get = require("./get");
const { Error } = require("oups");

class Post extends Get {
    constructor(giveme, route) {
        super(giveme, route);
    };
};

exports = module.exports = Post;