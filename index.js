/*!
 * dam-less
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

'use strict';

const GiveMeTheService = require('givemetheservice');

class DamLessServer {
    constructor(options) {
        this.giveme = new GiveMeTheService(options);                    //Create the container
        this.giveme.inject("dam-less", `${__dirname}/lib/dam-less`);    //Inject dam-less service
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
        const damless = await this.giveme.resolve("dam-less");
        await damless.get(route, service, method, options);
    }

    async post(route, service, method, options) {
        const damless = await this.giveme.resolve("dam-less");
        await damless.post(route, service, method, options);
    }

    async put(route, service, method, options) {
        const damless = await this.giveme.resolve("dam-less");
        await damless.put(route, service, method, options);
    }

    async delete(route, service, method, options) {
        const damless = await this.giveme.resolve("dam-less");
        await damless.delete(route, service, method, options);
    }

    async patch(route, service, method, options) {
        const damless = await this.giveme.resolve("dam-less");
        await damless.patch(route, service, method, options);
    }

    async asset(route, filepath) {
        const damless = await this.giveme.resolve("dam-less");
        await damless.asset(route, filepath);
    }
}

module.exports = DamLessServer;
module.exports.AuthJwtToken = require('./lib/services/auth-jwt-token');