/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const path = require("path");
const GiveMeTheService = require("givemetheservice");
const EventEmitter = require("events");

class DamLessServer {

    constructor(options = {}) {
        options.config = options.config || "./damless.json";
        
        this.eventEmitter = new EventEmitter();
        this.giveme = new GiveMeTheService({ dirname: options.dirname }); // Create the container
        this.config = typeof options.config == "object" ? options.config : require(path.resolve(this.giveme.root, options.config));

        // inject all core services
        this.giveme.inject("config", this.config);
        this.giveme.inject("eventEmitter", this.eventEmitter);
        this.giveme.inject("services-loader", `${__dirname}/lib/services/core/services-loader`); // Need to be on top of injected services. services-loader constructor will inject others services. But services-loader constructor is calling after load. So default service will be overrideed.
        this.giveme.inject("fs", `${__dirname}/lib/services/core/fs`);
        this.giveme.inject("event", `${__dirname}/lib/services/core/event`);
        this.giveme.inject("json", `${__dirname}/lib/services/core/json`);
        this.giveme.inject("json-stream", `${__dirname}/lib/services/core/json-stream`);
        this.giveme.inject("qjimp", `${__dirname}/lib/services/core/qjimp`);
        this.giveme.inject("client", `${__dirname}/lib/services/core/client`);
        this.giveme.inject("walk", `${__dirname}/lib/services/core/walk`);
        this.giveme.inject("crypto", `${__dirname}/lib/services/core/crypto`);
        this.giveme.inject("password", `${__dirname}/lib/services/core/password`);
        this.giveme.inject("repository-factory", `${__dirname}/lib/services/core/repository-factory`);
        this.giveme.inject("damless", `${__dirname}/lib/damless`);
        this.giveme.inject("middleware", `${__dirname}/lib/services/middleware`); // After damless beacause http-router must be created.
    }

    async start() {
        await this.giveme.load();
        return this;
    }

    async stop() {
        await this.giveme.unload();
        return this;
    }

    config(fn) {
        fn(this.giveme.config);
        return this;
    }

    inject(name, location, options) {
        this.giveme.inject(name, location, options);
        return this;
    }

    async resolve(name) {
        return await this.giveme.resolve(name);
    }

    async get(route, service, method, options) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.get(route, service, method, options);
    }

    async post(route, service, method, options) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.post(route, service, method, options);
    }

    async put(route, service, method, options) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.put(route, service, method, options);
    }

    async delete(route, service, method, options) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.delete(route, service, method, options);
    }

    async patch(route, service, method, options) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.patch(route, service, method, options);
    }

    async asset(route, filepath) {
        const damless = await this.giveme.resolve("damless", { mount: false });
        await damless.asset(route, filepath);
    }

    async use(middlewareName) {
        const middleware = await this.giveme.resolve("middleware", { mount: false });
        middleware.push(middlewareName);
        return this;
    }

    on(type, listener) {
        this.eventEmitter.on(type, listener);
        return this;
    }
}

const {
    Client,
    Crypto: CryptoService,
    Event: EventService,
    FS,
    JsonStream,
    Json,
    Password,
    QJimp,
    RepositoryFactory,
    String: StringService,
    Walk
} = require('./lib/services/core');

const {
    AskReply,
    AuthJwtToken,
    CompressedStream,
    ContentType,
    ContextFactory,
    IsItForMe,
    QueryString,
    QueryParams,
    Middleware
} = require('./lib/services');

const {
    transform,
    streamify,
    noop,
    getFirst,
    getAll,
    getBuffer,
    ending,
    ArrayToStream,
    StreamFlow
} = require('./lib/core');

module.exports = DamLessServer;
// Export givemetheservice services
module.exports.Client = Client;
module.exports.Crypto = CryptoService;
module.exports.Event = EventService;
module.exports.FS = FS;
module.exports.JsonStream = JsonStream;
module.exports.Json = Json;
module.exports.Password = Password;
module.exports.QJimp = QJimp;
module.exports.RepositoryFactory = RepositoryFactory;
module.exports.String = StringService;
module.exports.Walk = Walk;
// Export damless services
module.exports.AskReply = AskReply;
module.exports.AuthJwtToken = AuthJwtToken;
module.exports.CompressedStream = CompressedStream;
module.exports.ContentType = ContentType;
module.exports.ContextFactory = ContextFactory;
module.exports.IsItForMe = IsItForMe;
module.exports.QueryString = QueryString;
module.exports.QueryParams = QueryParams;
module.exports.Middleware = Middleware;
// Export damless core
module.exports.transform = transform;
module.exports.streamify = streamify;
module.exports.getFirst = getFirst;
module.exports.getAll = getAll;
module.exports.getBuffer = getBuffer;
module.exports.ending = ending;
module.exports.noop = noop;
module.exports.ArrayToStream = ArrayToStream;
module.exports.StreamFlow = StreamFlow;
