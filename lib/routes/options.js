/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { Error } = require("oups");

class Options {
    constructor(qwebs) {
        this.qwebs = qwebs;
    };

    async invoke (context, stream, headers) {
        const { pathname, url } = context;

        let allow = [];
        if (url == "*") allow = ["GET","POST","PUT", "PATCH","DELETE","HEAD","OPTIONS"];
        else {
            const isitget = await this.qwebs.resolve("isitget");
            const isitasset = await this.qwebs.resolve("isitasset");
            const isitpost = await this.qwebs.resolve("isitpost");
            const isitdelete = await this.qwebs.resolve("isitdelete");
            const isitput = await this.qwebs.resolve("isitput");
            const isitpatch = await this.qwebs.resolve("isitpatch");

            if (isitget.ask(pathname) || isitasset.ask(pathname)) allow.push("GET");
            if (isitpost.ask(pathname)) allow.push("POST");
            if (isitdelete.ask(pathname)) allow.push("DELETE");
            if (isitput.ask(pathname)) allow.push("PUT");
            if (isitpatch.ask(pathname)) allow.push("PATCH");
        }

        stream.headers["Allow"] = allow.join();
        stream.end();
    };
};

exports = module.exports = Options;