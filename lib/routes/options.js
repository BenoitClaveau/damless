/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class Options {
    constructor(giveme) {
        this.giveme = giveme;
    };

    async invoke(context, stream, headers) {
        const {
            pathname,
            url
        } = context;

        let allow = [];
        if (url == "*") allow = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
        else {
            const isitget = await this.giveme.resolve("isitget");
            const isitasset = await this.giveme.resolve("isitasset");
            const isitpost = await this.giveme.resolve("isitpost");
            const isitdelete = await this.giveme.resolve("isitdelete");
            const isitput = await this.giveme.resolve("isitput");
            const isitpatch = await this.giveme.resolve("isitpatch");
            if (isitget.ask(pathname) || isitasset.ask(pathname)) allow.push("GET");
            if (isitpost.ask(pathname)) allow.push("POST");
            if (isitdelete.ask(pathname)) allow.push("DELETE");
            if (isitput.ask(pathname)) allow.push("PUT");
            if (isitpatch.ask(pathname)) allow.push("PATCH");
        }

        const middleware = await this.giveme.resolve("middleware");
        const handeled = await middleware.invoke(context, stream, headers);
        if (handeled) return;
        
        stream
            .respond({ "Allow ": allow.join() })
            .end();
    };
};

exports = module.exports = Options;