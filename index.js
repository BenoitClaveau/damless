/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */



const GiveMeTheService = require('givemetheservice');

class DamLessServer {
    constructor(options = {}) {
        options.config = options.config || "./damless.json";
        this.giveme = new GiveMeTheService(options);                    //Create the container
        this.giveme.inject("damless", `${__dirname}/lib/damless`);    //Inject damless service
    }

    async start() {
        await this.giveme.load();
    }

    async stop() {
        await this.giveme.unload();
    }

    get config() {
        return this.giveme.config;
    }

    inject(name, location, options) {
        this.giveme.inject(name, location, options)
    }

    async resolve(name) {
        return await this.giveme.resolve(name);
    }

    async get(route, service, method, options) {
        const damless = await this.giveme.resolve("damless");
        await damless.get(route, service, method, options);
    }

    async post(route, service, method, options) {
        const damless = await this.giveme.resolve("damless");
        await damless.post(route, service, method, options);
    }

    async put(route, service, method, options) {
        const damless = await this.giveme.resolve("damless");
        await damless.put(route, service, method, options);
    }

    async delete(route, service, method, options) {
        const damless = await this.giveme.resolve("damless");
        await damless.delete(route, service, method, options);
    }

    async patch(route, service, method, options) {
        const damless = await this.giveme.resolve("damless");
        await damless.patch(route, service, method, options);
    }

    async asset(route, filepath) {
        const damless = await this.giveme.resolve("damless");
        await damless.asset(route, filepath);
    }
}

module.exports = DamLessServer;
module.exports.Services = {
    ...require('givemetheservice/lib/services'),
    ...require('./lib/services')
};