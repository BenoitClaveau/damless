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
        const href = part.href ? decodeURIComponent(part.href) : null;
        const path = part.path ? decodeURIComponent(part.path) : null;
        const pathname = part.pathname ? decodeURIComponent(part.pathname) : null;
        const port = part.port;
        const protocol = part.protocol;
        const search = part.search ? decodeURIComponent(part.search) : null;
        const slashes = part.slashes;
        const querystring = part.query ? decodeURIComponent(part.query) : null;
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
