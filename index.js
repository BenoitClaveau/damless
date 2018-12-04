/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const path = require("path");
var fs = require('fs');
const GiveMeTheService = require("givemetheservice");
const Commands = require("./lib/services/commands");

class DamLessServer {

    constructor() {
        //options.config = options.config || "./damless.json";
        this.commands = new Commands();
        this.giveme = new GiveMeTheService(); // Create the container
        this._config = {};
        // inject all core services
        this.giveme.inject("services-loader", `${__dirname}/lib/services/core/services-loader`); // Need to be on top of injected services. services-loader constructor will inject others services. But services-loader constructor is calling after load. So default service will be overrideed.
        this.giveme.inject("fs", `${__dirname}/lib/services/core/fs`);
        this.giveme.inject("json", `${__dirname}/lib/services/core/json`);
        this.giveme.inject("json-stream", `${__dirname}/lib/services/core/json-stream`);
        this.giveme.inject("qjimp", `${__dirname}/lib/services/core/qjimp`);
        this.giveme.inject("client", `${__dirname}/lib/services/core/client`);
        this.giveme.inject("walk", `${__dirname}/lib/services/core/walk`);
        this.giveme.inject("crypto", `${__dirname}/lib/services/core/crypto`);
        this.giveme.inject("password", `${__dirname}/lib/services/core/password`);
        this.giveme.inject("repository-factory", `${__dirname}/lib/services/core/repository-factory`);
        this.giveme.inject("middleware", `${__dirname}/lib/services/middleware`);
        this.giveme.inject("http-server", `${__dirname}/lib/http-server`);
        this.giveme.inject("config", this._config); // Inject default config
        this.giveme.inject("commands", this.commands); // Inject default config
    }

    async start() {
        await this.giveme.load();
    }

    async stop() {
        await this.giveme.unload();
    }

    async resolve(name, options) {
        return await this.giveme.resolve(name, options);
    }

    config(data) {
        if (typeof data == "string") {
            const file = path.resolve(this.giveme.root, data);
            if (fs.existsSync(file)) {
                this._config = require(file);
                this.giveme.inject("config", this._config);
            }
        }
        if (typeof data == "object") {
            this._config = data;
            this.giveme.inject("config", this._config);
        }
        if (typeof data == "function") {
            data(this._config);
            this.giveme.inject("config", this._config);
        }
        return this;
    }

    inject(name, location, options) {
        this.commands.push(async () => {
            this.giveme.inject(name, location, options);
        })
        return this;
    }

    get(route, service, method, options) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.get(route, service, method, options);
        });
        return this;
    }

    post(route, service, method, options) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.post(route, service, method, options);
        });
        return this;
    }

    put(route, service, method, options) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.put(route, service, method, options);
        });
        return this;
    }

    delete(route, service, method, options) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.delete(route, service, method, options);
        });
        return this;
    }

    patch(route, service, method, options) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.patch(route, service, method, options);
        });
        return this;
    }

    asset(route, filepath) {
        this.commands.push(async () => {
            const damless = await this.resolve("damless", { mount: false });
            await damless.asset(route, filepath);
        });
        return this;
    }

    use(middleware) {
        this.commands.push(async () => {
            const m = await this.resolve("middleware", { mount: false });
            m.push(middleware);
        });
        return this;
    }

    cwd(value) {
        this.giveme.root = value;
        return this;
    }
}

const {
    Client,
    Crypto: CryptoService,
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
    CompressedStream,
    ContentType,
    ContextFactory,
    IsItForMe,
    QueryString,
    QueryParams,
    Middlewares
} = require('./lib/services');

const {
    AuthJWT,
    ForwardToAsset,
    OAuth2
} = require('./lib/services/middlewares');

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
module.exports.CompressedStream = CompressedStream;
module.exports.ContentType = ContentType;
module.exports.ContextFactory = ContextFactory;
module.exports.IsItForMe = IsItForMe;
module.exports.QueryString = QueryString;
module.exports.QueryParams = QueryParams;
module.exports.Middlewares = Middlewares;
// Export damless middleware
module.exports.AuthJWT = AuthJWT;
module.exports.ForwardToAsset = ForwardToAsset;
module.exports.OAuth2 = OAuth2;
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
