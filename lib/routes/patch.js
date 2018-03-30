/*!
 * dam-less
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const Post = require("./post");

class Patch extends Post {
    constructor(giveme, route) {
        super(giveme, route);
    };
};

exports = module.exports = Patch;
