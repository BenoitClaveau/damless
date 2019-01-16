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
        this.giveme.inject("damless", this);
        this.giveme.inject("services-loader", `${__dirname}/lib/services/core/services-loader`); // Need to be on top of injected services. services-loader constructor will inject others services. But services-loader constructor is calling after load. So default service will be overrideed.
        this.giveme.inject("fs", `${__dirname}/lib/services/core/fs`);
        this.giveme.inject("json", `${__dirname}/lib/services/core/json`);
        this.giveme.inject("json-stream", `${__dirname}/lib/services/core/json-stream`);
        this.giveme.inject("text-stream", `${__dirname}/lib/services/core/text-stream`);
        this.giveme.inject("qjimp", `${__dirname}/lib/services/core/qjimp`);
        this.giveme.inject("client", `${__dirname}/lib/services/core/client`);
        this.giveme.inject("walk", `${__dirname}/lib/services/core/walk`);
        this.giveme.inject("crypto", `${__dirname}/lib/services/core/crypto`);
        this.giveme.inject("password", `${__dirname}/lib/services/core/password`);
        this.giveme.inject("repository-factory", `${__dirname}/lib/services/core/repository-factory`);
        this.giveme.inject("middleware", `${__dirname}/lib/services/middleware`);
        this.giveme.inject("http-server", `${__dirname}/lib/http-server`);
        this.giveme.inject("config", this._config); // Inject default config
        
    }

    async start() {
        await this.giveme.importAll(); // require all modules
        await this.giveme.resolve("services-loader", { mount: false }); // services-loader contructor will inject services in json.
        await this.commands.run(); // We inject or override services
        await this.giveme.importAll(); // require all new injected modules (old will ot be imported)
        await this.giveme.createAll();
        await this.giveme.mountAll();
        return this;
    }

    async stop() {
        await this.giveme.unload();
        return this;
    }

    cwd(value) {
        this.giveme.root = value;
        return this;
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

    use(middleware) {
        this.commands.push(async () => {
            const service = await this.resolve("middleware");
            await service.push(middleware);
        });
        return this;
    }

    on(service, event, listener) {
        this.commands.push(async () => {
            const s = await this.resolve(service);
            s.on(event, listener);
        });
        return this;
    }

    async resolve(name, options) {
        return await this.giveme.resolve(name, options);
    }

    inject(name, location, options) {
        this.commands.push(async () => {
            this.giveme.inject(name, location, options);
        })
        return this;
    }

    get(route, service, method, options) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.get(route, service, method, options);
        });
        return this;
    }

    post(route, service, method, options) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.post(route, service, method, options);
        });
        return this;
    }

    put(route, service, method, options) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.put(route, service, method, options);
        });
        return this;
    }

    delete(route, service, method, options) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.delete(route, service, method, options);
        });
        return this;
    }

    patch(route, service, method, options) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.patch(route, service, method, options);
        });
        return this;
    }

    asset(route, filepath) {
        this.commands.push(async () => {
            const httpServer = await this.resolve("http-server");
            await httpServer.asset(route, filepath);
        });
        return this;
    }
}

const {
    HttpServer,
    HttpRouter
} = require('./lib');

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
    StreamToArray,
    StreamFlow
} = require('./lib/core');

module.exports = DamLessServer;
// Export main service 
module.exports.HttpServer = HttpServer;
module.exports.HttpRouter = HttpRouter;
// Export core services
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
module.exports.StreamToArray = StreamToArray;
module.exports.StreamFlow = StreamFlow;
