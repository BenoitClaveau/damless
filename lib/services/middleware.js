/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { Error } = require("oups");

class Middleware {

    constructor(giveme) {
        this.giveme = giveme;
        this.middlewares = [];

        this.giveme.inject("forward-to-asset", `${__dirname}/middlewares/forward-to-asset`);
        this.giveme.inject("auth-jwt", `${__dirname}/middlewares/auth-jwt`);
        this.giveme.inject("oauth2", `${__dirname}/middlewares/oauth2`);
    };

    async push(middleware) {
        if (typeof middleware == "function")
            this.middlewares.push({ invoke: middleware });
        else if (typeof middleware == "string")
            this.middlewares.push({ serviceName: middleware });
        else throw new Error("Failed to attach the middleware.")
    }

    async invoke(context, stream, headers) {
        for (let middleware of this.middlewares) {
            const {serviceName, invoke} = middleware;
            if (serviceName) {
                const service = await this.giveme.resolve(serviceName);
                const handeled = await service.invoke(context, stream, headers);
                if (handeled) return handeled;
            }
            if (invoke) {
                const handeled = await invoke(context, stream, headers);
                if (handeled) return handeled;
            }
        }
    }
}

module.exports = Middleware;