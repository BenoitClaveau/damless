/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { Error } = require("oups");

class Middleware {

    constructor(giveme) {
        this.giveme = giveme;
        this.middelwares = [{ name: "forward-to-asset" }];

        this.giveme.inject("forward-to-asset", `${__dirname}/middlewares/forward-to-asset`);
        this.giveme.inject("auth-jwt", `${__dirname}/middlewares/auth-jwt`);
        this.giveme.inject("oauth2", `${__dirname}/middlewares/oauth2`);
    };

    async mount() {
        for (let middelware of this.middelwares) {
            middelware.service = await this.giveme.resolve(middelware.name, { mount: false });
        }
    }
    
    push(middelwareName) {
        this.middelwares.push({ name: middelwareName });
    }

    splice(start, deleteCount, ...items) {
        this.middelwares.push(start, deleteCount, ...items.map(e => ({ name: e })));
    }

    async invoke(context, stream, headers) {
        for (let middelware of this.middelwares) {
            if (!middelware.service) throw new Error("Middleware service ${name} is not mounted.", { name: middelware.name });
            if (!middelware.service.invoke) throw new Error("Middleware ${name} has not invoke method.", { name: middelware.name });
            const handled = await middelware.service.invoke(context, stream, headers);
            if (handled) return handled;
        }
    }
}

module.exports = Middleware;