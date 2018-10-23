/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const GiveMeTheService = require('givemetheservice');
const EventEmitter = require(`events`);

class DamLessServer {
    constructor(options = {}) {
        options.config = options.config || "./damless.json";
        this.eventEmitter = new EventEmitter();
        this.giveme = new GiveMeTheService(options);                    //Create the container
        this.giveme.inject("eventEmitter", this.eventEmitter);          //Event emmitter
        this.giveme.inject("damless", `${__dirname}/lib/damless`);      //Inject damless service
        
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

    on(type, listener) {
        this.eventEmitter.on(type, listener);
        return this;
    }
}

const {
    AskReply,
    AuthJwtToken,
    CompressedStream,
    ContentType,
    ContextFactory,
    IsItForMe,
    QueryString,
    QueryParams
} = require('./lib/services');

const {
    transform,
    streamify,
    noop,
    getFirst,
    getAll,
    getBuffer,
    ending,
    toStream
} = require('./lib/core');

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
} = require('givemetheservice');

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
// Export damless core
module.exports.transform = transform;
module.exports.streamify = streamify;
module.exports.getFirst = getFirst;
module.exports.getAll = getAll;
module.exports.getBuffer = getBuffer;
module.exports.ending = ending;
module.exports.noop = noop;
module.exports.toStream = toStream;
