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

    async on(type, listener) {
        const damless = await this.giveme.resolve("damless");
        damless.on(type, listener);
    }
}

module.exports = DamLessServer;
// Export givemetheservice services
module.exports.Client = require("givemetheservice").Client;
module.exports.Crypto = require("givemetheservice").Crypto;
module.exports.Event = require("givemetheservice").Event;
module.exports.FS = require("givemetheservice").FS;
module.exports.JsonStream = require("givemetheservice").JsonStream;
module.exports.Json = require("givemetheservice").Json;
module.exports.Password = require("givemetheservice").Password;
module.exports.QJimp = require("givemetheservice").QJimp;
module.exports.RepositoryFactory = require("givemetheservice").RepositoryFactory;
module.exports.String = require("givemetheservice").String;
module.exports.Walk = require("givemetheservice").Walk;
// Export damless services
module.exports.AskReply = require("./lib/services/ask-reply");
module.exports.AuthJwtToken = require("./lib/services/auth-jwt-token");
module.exports.CompressedStream = require("./lib/services/compressed-stream");
module.exports.ContentType = require("./lib/services/content-type");
module.exports.ContextFactory = require("./lib/services/context-factory");
module.exports.IsItForMe = require("./lib/services/isitforme");
module.exports.QueryString = require("./lib/services/querystring");
module.exports.QueryParams = require("./lib/services/queryparams");