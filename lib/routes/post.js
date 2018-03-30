/*!
 * dam-less
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const Get = require("./get");
const { Error } = require("oups");

class Post extends Get {
    constructor(giveme, route) {
        super(giveme, route);
    };
};

exports = module.exports = Post;