/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const URL = require("url");

class ContextFactory {
    
    constructor(giveme, querystring, queryparams, AskReply) {
        this.giveme = giveme;
        this.querystring = querystring;
        this.queryparams = queryparams;
        this.AskReply = AskReply;
    }

    getContext(method, originalUrl) {
        const giveme = this.giveme;
        const url = decodeURIComponent(originalUrl);
        const part = URL.parse(url);
        const auth = part.auth;
        const hash = part.hash;
        const host = part.host;
        const hostname = part.hostname;
        const href = decodeURIComponent(part.href);
        const path = decodeURIComponent(part.path);
        const pathname = decodeURIComponent(part.pathname);
        const port = part.port;
        const protocol = part.protocol;
        const search = decodeURIComponent(part.search);
        const slashes = part.slashes;
        const querystring = decodeURIComponent(part.query);
        const query = this.querystring.parse(querystring);
        return { giveme, url, method, auth, hash, host, hostname, href, path, pathname, port, protocol, search, slashes, querystring, query };
    }

    extendContext(context, data) {
        context.params = data ? this.queryparams.typed(data.params) : {};
        context.route = data ? data.router : {};
        context.route.options = context.route.options || {};
    }

    async getStream(request, response, headers) {
        const { AskReply, giveme } = this;
        const askReply = new AskReply(giveme, request, response, headers);
        await askReply.mount();
        return askReply;
    }
}

module.exports = ContextFactory;
