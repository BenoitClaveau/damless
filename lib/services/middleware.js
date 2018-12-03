/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { Error } = require("oups");

class Middlewares {

    constructor(giveme) {
        this.giveme = giveme;
        this.middlewares = [{ name: "forward-to-asset" }];

        this.giveme.inject("forward-to-asset", `${__dirname}/middlewares/forward-to-asset`);
        this.giveme.inject("auth-jwt", `${__dirname}/middlewares/auth-jwt`);
        this.giveme.inject("oauth2", `${__dirname}/middlewares/oauth2`);
    };

    async mount() {
        for (let middleware of this.middlewares) {
            middleware.service = await this.giveme.resolve(middleware.name, { mount: false });
        }
    }
    
    push(middlewareName) {
        this.middlewares.push({ name: middlewareName });
    }

    splice(start, deleteCount, ...items) {
        this.middlewares.push(start, deleteCount, ...items.map(e => ({ name: e })));
    }

    async invoke(context, stream, headers) {
        for (let middleware of this.middlewares) {
            if (!middleware.service) throw new Error("Middleware service ${name} is not mounted.", { name: middleware.name });
            if (!middleware.service.invoke) throw new Error("Middleware ${name} has not invoke method.", { name: middleware.name });
            const handled = await middleware.service.invoke(context, stream, headers);
            if (handled) return handled;
        }
    }
}

module.exports = Middlewares;