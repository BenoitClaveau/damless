/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Error } = require("oups");

class Options {
    constructor(giveme) {
        this.giveme = giveme;
    };

    mount() {
        this.isitget = await this.giveme.resolve("isitget");
        this.isitasset = await this.giveme.resolve("isitasset");
        this.isitpost = await this.giveme.resolve("isitpost");
        this.isitdelete = await this.giveme.resolve("isitdelete");
        this.isitput = await this.giveme.resolve("isitput");
        this.isitpatch = await this.giveme.resolve("isitpatch");
        this.damless = await this.giveme.resolve("damless");
    }

    async invoke (context, stream, headers) {
        const { 
            pathname, 
            url 
        } = context;

        let allow = [];
        if (url == "*") allow = ["GET","POST","PUT", "PATCH","DELETE","HEAD","OPTIONS"];
        else {
            if (this.isitget.ask(pathname) || this.isitasset.ask(pathname)) allow.push("GET");
            if (this.isitpost.ask(pathname)) allow.push("POST");
            if (this.isitdelete.ask(pathname)) allow.push("DELETE");
            if (this.isitput.ask(pathname)) allow.push("PUT");
            if (this.isitpatch.ask(pathname)) allow.push("PATCH");
        }

        this.damless.emit("options", { context, headers });
        stream.headers["Allow"] = allow.join();
        stream.end();
    };
};

exports = module.exports = Options;