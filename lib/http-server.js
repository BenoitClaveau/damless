/*!
 * http-server
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    Error,
    UndefinedError
} = require("oups");
const path = require(`path`);
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);
const http2 = require(`http2`);
const EventEmitter = require('events');
const { ending } = require("./core");

class HttpServer extends EventEmitter {
    constructor(injector, config) {
        super();
        if (!injector) throw new UndefinedError("injector");
        if (!config) throw new UndefinedError("config");
        if (!config.http && !config.https && !config.http2) throw new UndefinedError("Http, https or http2 config");

        this.httpServer = null;
        this.httpsServer = null;
        this.http2SecureServer = null;
        this.http2Server = null;
        this.injector = injector;
        this.config = config;

        this.injector.inject("querystring", `${__dirname}/services/querystring`);
        this.injector.inject("queryparams", `${__dirname}/services/queryparams`);
        this.injector.inject("IsItForMe", `${__dirname}/services/isitforme`, { instanciate: false });
        this.injector.inject("OptionsLeaf", `${__dirname}/router/options-leaf`, { instanciate: false });
        this.injector.inject("CompressedStream", `${__dirname}/services/compressed-stream`, { instanciate: false });
        this.injector.inject("context-factory", `${__dirname}/services/context-factory`);
        this.injector.inject("Get", `${__dirname}/routes/get`, { instanciate: false });
        this.injector.inject("Post", `${__dirname}/routes/post`, { instanciate: false });
        this.injector.inject("Delete", `${__dirname}/routes/delete`, { instanciate: false });
        this.injector.inject("Put", `${__dirname}/routes/put`, { instanciate: false });
        this.injector.inject("Patch", `${__dirname}/routes/patch`, { instanciate: false });
        this.injector.inject("Asset", `${__dirname}/routes/asset`, { instanciate: false });
        this.injector.inject("AskReply", `${__dirname}/services/ask-reply`, { instanciate: false });
        this.injector.inject("http-router", `${__dirname}/http-router`);
        this.injector.inject("http-assets-loader", `${__dirname}/loaders/assets`);
        this.injector.inject("http-middlewares-loader", `${__dirname}/loaders/middlewares`);
        this.injector.inject("http-routes-loader", `${__dirname}/loaders/routes`);
        this.injector.inject("content-type", `${__dirname}/services/content-type`);
    };

    async mount() {
        const assets = await this.injector.resolve("http-assets-loader");
        const middlewares = await this.injector.resolve("http-middlewares-loader");
        const routes = await this.injector.resolve("http-routes-loader");

        await assets.load();
        await middlewares.load();
        await routes.load();

        if (this.config.http) await this.createHttpServer(this.config.http);
        if (this.config.https) await this.createHttpsServer(this.config.https);
        if (this.config.http2) await this.createHttp2SecureServer(this.config.http2);
        if (this.config["http2-unsecure"]) await this.createHttp2Server(this.config["http2-unsecure"]);
    }

    async unmount() {
        if (this.httpServer) {
            await new Promise((resolve, reject) => this.httpServer.close(resolve));
            this.emit("close", { server: "http", port: this.config.http.port });
        }
        if (this.httpsServer) {
            await new Promise((resolve, reject) => this.httpsServer.close(resolve));
            this.emit("close", { server: "https", port: this.config.https.port });
        }
        if (this.http2SecureServer) {
            await new Promise((resolve, reject) => this.http2SecureServer.close(resolve));
            this.emit("close", { server: "http2", port: this.config.http2.port });
        }
        if (this.http2Server) {
            await new Promise((resolve, reject) => this.http2Server.close(resolve));
            this.emit("close", { server: "http2-unsecure", port: this.config["http2-unsecure"].port });
        }
    }

    async get(route, service, method, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.get(route);
            await item.init(service, method, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${method} of ${service} for GET:${route}", { route, service, method }, error);
        }
    };

    async asset(route, filepath, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.asset(route);
            await item.init(filepath, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${filepath} for asset ${route}", { route, filepath }, error);
        }
    };

    async post(route, service, method, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.post(route);
            await item.init(service, method, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${method} of ${service} for POST:${route}", { route, service, method }, error);
        }
    };

    async put(route, service, method, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.put(route);
            await item.init(service, method, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${method} of ${service} for PUT:${route}", { route, service, method }, error);
        }
    };

    async patch(route, service, method, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.patch(route);
            await item.init(service, method, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${method} of ${service} for PATCH:${route}", { route, service, method }, error);
        }
    };

    async delete(route, service, method, options) {
        try {
            const router = await this.injector.resolve("http-router");
            const item = await router.delete(route);
            await item.init(service, method, options);
            return item;
        }
        catch (error) {
            throw new Error("Failed the register ${method} of ${service} for DELETE:${route}", { route, service, method }, error);
        }
    };

    async invoke(request, response) {
        try {
            const router = await this.injector.resolve("http-router");
            const factory = await this.injector.resolve("context-factory");
            const {
                headers,
                method,
                url
            } = request;
            const context = factory.getContext(method, url);
            const stream = await factory.getStream(request, response, headers);
            try {
                await router.invoke(context, stream, headers);
            }
            catch(error) {
                const completed = ending(stream, { resume: false });
                await this.writeError(error, context, stream, headers);
                await completed;
            }
        }
        catch (error) {
            if (!response.headersSent) {
                response.statusCode = error.statusCode || 500;
                response.end();
            }
            else {
                console.error(error.message);
                console.error(error.stack);
            }
        }
    };

    async invoke2(stream, headers, flags) {
        try {
            const router = await this.injector.resolve("http-router");
            const factory = await this.injector.resolve("context-factory");
            const context = factory.getContext(request);
            const wrappedStream = await factory.getStream(stream, stream, headers);
            try {
                await router.invoke(context, wrappedStream, headers, flags);
            }
            catch(error) {
                const completed = ending(stream, { resume: false });
                await this.writeError(error, context, stream, headers);
                await completed;
            }
        }
        catch (error) {
            if (!response.headersSent) {
                response.statusCode = error.statusCode || 500;
                response.end();
            }
            else {
                console.error(error.message);
                console.error(error.stack);
            }
        }
    };

    async writeError(error, context, stream, headers) {
        const {
            message,
            stack
        } = error;

        const statusCode = error.statusCode || 500;
        if (statusCode == 404)
            stream
                .mode("object")
                .respond({ statusCode })
                .end({ message: `Page ${context.pathname} not found.` });
        else {
            stream
                .mode("object")
                .respond({ statusCode })
                .end({ message, stack });
        }
    }

    async createHttpServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Http port`);

        this.httpServer = http.createServer();

        if (/true/i.test(config[`redirect-to-http`])) {
            if (!config.host) throw new UndefinedError(`Http host`);

            this.httpServer.on("request", async (request, response) => {
            });
        }
        else {
            this.httpServer.on("request", async (request, response) => {
                await this.invoke(request, response);
            });
        }

        await new Promise((resolve, reject) => this.httpServer.listen(config.port, resolve));
        this.emit("listening", { server: "http", port: config.port });
    }

    async createHttpsServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Https port`);
        if (!config.key) throw new UndefinedError(`Https key`);
        if (!config.cert) throw new UndefinedError(`Https cert`);
        if (!config.ca) throw new UndefinedError(`Https ca`);
        if (config.ca.length != 2) throw new Error(`Https ca is not well defined in config.`);

        let options = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert),
            ca: [
                fs.readFileSync(config.ca[0]),
                fs.readFileSync(config.ca[1])
            ]
        };

        this.httpsServer = https.createServer(options);

        this.httpsServer.on("request", async (request, response) => {
            await this.invoke(request, response);
        });

        await new Promise((resolve, reject) => this.httpsServer.listen(config.port, resolve));
        this.emit("listening", { server: "https", port: config.port });
    }

    async createHttp2SecureServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Http2 port`);
        if (!config.key) throw new UndefinedError(`Https key`);
        if (!config.cert) throw new UndefinedError(`Https cert`);

        //openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout private-key.pem -out certificate.pem
        const options = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert),
            allowHTTP1: true
        };
        this.http2SecureServer = http2.createSecureServer(options);

        this.http2SecureServer.on("request", async (request, response) => {
            await this.invoke(request, response);
        });

        this.http2SecureServer.on("stream", async (stream, headers, flags) => {
            await this.invoke2(stream, headers, flags);
        });

        this.http2SecureServer.on("error", (err) => {
            console.error(err)
        });
        this.http2SecureServer.on("socketError", (err) => {
            console.error(err)
        });

        await new Promise((resolve, reject) => this.http2SecureServer.listen(config.port, resolve));
        this.emit("listening", { server: "http2", port: config.port });
    }

    async createHttp2Server(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`http2-unsecure port`);

        const options = {
            allowHTTP1: true
        };
        this.http2Server = http2.createServer(options);

        this.http2Server.on("request", async (request, response) => {
            await this.invoke(request, response);
        });

        this.http2Server.on("stream", async (stream, headers, flags) => {
            await this.invoke2(stream, headers, flags);
        });

        this.http2Server.on("error", (err) => {
            console.error(err)
        });
        this.http2Server.on("socketError", (err) => {
            console.error(err)
        });

        await new Promise((resolve, reject) => this.http2Server.listen(config.port, resolve));
        this.emit("listening", { server: "http-unsecure", port: config.port });
    }
};

exports = module.exports = HttpServer;