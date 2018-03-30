/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const Get = require("./get");
const { Error } = require("oups");

class Post extends Get {
    constructor(qwebs, route) {
        super(qwebs, route);
    };
};

exports = module.exports = Post;