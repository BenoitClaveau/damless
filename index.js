/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */



const GiveMeTheService = require('givemetheservice');

class DamLessServer {
    constructor(options) {
        this.giveme = new GiveMeTheService(options);                    //Create the container
        this.giveme.inject("dambreaker", `${__dirname}/lib/dambreaker`);    //Inject dambreaker service
    }

    async start() {
        await this.giveme.load();
    }

    async stop() {
        await this.giveme.unload();
    }

    inject(name, location, options) {
        this.giveme.inject(name, location, options)
    }

    async resolve(name) {
        return await this.giveme.resolve(name);
    }

    async get(route, service, method, options) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.get(route, service, method, options);
    }

    async post(route, service, method, options) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.post(route, service, method, options);
    }

    async put(route, service, method, options) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.put(route, service, method, options);
    }

    async delete(route, service, method, options) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.delete(route, service, method, options);
    }

    async patch(route, service, method, options) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.patch(route, service, method, options);
    }

    async asset(route, filepath) {
        const dambreaker = await this.giveme.resolve("dambreaker");
        await dambreaker.asset(route, filepath);
    }
}

module.exports = DamLessServer;
module.exports.AuthJwtToken = require('./lib/services/auth-jwt-token');