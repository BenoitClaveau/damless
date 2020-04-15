/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { Error } = require("oups");

class Middleware {

    static *services() {
        yield { name: "forward-to-asset", location: `${__dirname}/middlewares/forward-to-asset` };
        yield { name: "auth-jwt", location: `${__dirname}/middlewares/auth-jwt` };
        yield { name: "oauth2", location: `${__dirname}/middlewares/oauth2` };
        yield { name: "cors", location: `${__dirname}/middlewares/cors` };
    }

    constructor(giveme) {
        this.giveme = giveme;
        this.middlewares = [];
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
                if (typeof service.invoke !== "function") throw new Error("${serviceName} is defined as a middleware, but hasn't got any invoke method.", { serviceName });
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