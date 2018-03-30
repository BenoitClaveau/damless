/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const Busboy = require('busboy');
const URL = require("url");

class ContextFactory {
    constructor(qwebs, querystring, AskReply) {
        this.qwebs = qwebs;
        this.querystring = querystring;
        this.AskReply = AskReply;
    }

    getContext(method, originalUrl) {
        if (!method) throw new UndefinedError("method");
        if (!originalUrl) throw new UndefinedError("originalUrl");
        const qwebs = this.qwebs;
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
        return { qwebs, url, method, auth, hash, host, hostname, href, path, pathname, port, protocol, search, slashes, querystring, query };
    }

    async getStream(request, response, headers) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("request");
        if (!headers) throw new UndefinedError("headers");
        const { AskReply, qwebs } = this;
        const askReply = new AskReply(qwebs, request, response, headers);
        await askReply.mount();
        return askReply;
    }
}

module.exports = ContextFactory;
