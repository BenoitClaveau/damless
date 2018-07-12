/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    UndefinedError, 
    Error, 
    HttpError, 
    NotImplementedError 
} = require("oups");
const Busboy = require('busboy');
const URL = require("url");

class ContextFactory {
    constructor(giveme, querystring, queryparams, AskReply) {
        this.giveme = giveme;
        this.querystring = querystring;
        this.queryparams = queryparams;
        this.AskReply = AskReply;
    }

    getContext(method, originalUrl) {
        if (!method) throw new UndefinedError("method");
        if (!originalUrl) throw new UndefinedError("originalUrl");
        const giveme = this.giveme;
        const url = decodeURIComponent(originalUrl);
        const part = URL.parse(url);
        const auth = part.auth;
        const hash = part.hash;
        const host = part.host;
        const hostname = part.hostname;
        const href = part.href;
        const path = part.path;
        const pathname = part.pathname;
        const port = part.port;
        const protocol = part.protocol;
        const search = part.search;
        const slashes = part.slashes;
        const querystring = part.query;
        const query = this.querystring.parse(querystring);
        return { giveme, url, method, auth, hash, host, hostname, href, path, pathname, port, protocol, search, slashes, querystring, query };
    }

    extendContext(context, data) {
        context.params = this.queryparams.typed(data.params);
        context.route = data.router;
        return context;
    }

    async getStream(request, response, headers) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("request");
        if (!headers) throw new UndefinedError("headers");
        const { AskReply, giveme } = this;
        const askReply = new AskReply(giveme, request, response, headers);
        await askReply.mount();
        return askReply;
    }
}

module.exports = ContextFactory;
