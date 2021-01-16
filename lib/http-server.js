/*!
 * http-server
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    Error,
    UndefinedError
} = require("oups");
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);
const http2 = require(`http2`);
const EventEmitter = require('events');
const domain = require('domain');

const exit = (server) => {
    const killtimer = setTimeout(() => process.exit(1), 5000);
    killtimer.unref();
    server.close();
}

class HttpServer extends EventEmitter {

    static *services() {
        yield { name: "querystring", location: `${__dirname}/services/querystring`};
        yield { name: "queryparams", location: `${__dirname}/services/queryparams`};
        yield { name: "IsItForMe", location: `${__dirname}/services/isitforme`, instanciate: false };
        yield { name: "OptionsLeaf", location: `${__dirname}/router/options-leaf`, instanciate: false };
        yield { name: "context-factory", location: `${__dirname}/services/context-factory`};
        yield { name: "Get", location: `${__dirname}/routes/get`, instanciate: false };
        yield { name: "Post", location: `${__dirname}/routes/post`, instanciate: false };
        yield { name: "Delete", location: `${__dirname}/routes/delete`, instanciate: false };
        yield { name: "Put", location: `${__dirname}/routes/put`, instanciate: false };
        yield { name: "Patch", location: `${__dirname}/routes/patch`, instanciate: false };
        yield { name: "Asset", location: `${__dirname}/routes/asset`, instanciate: false };
        yield { name: "AskReply", location: `${__dirname}/services/ask-reply`, instanciate: false };
        yield { name: "http-router", location: `${__dirname}/http-router`};
        yield { name: "http-assets-loader", location: `${__dirname}/loaders/assets`};
        yield { name: "http-middlewares-loader", location: `${__dirname}/loaders/middlewares`};
        yield { name: "http-routes-loader", location: `${__dirname}/loaders/routes`};
        yield { name: "content-type", location: `${__dirname}/services/content-type`};
    }   

    constructor(injector, config) {
        super();
        this.httpServer = null;
        this.httpsServer = null;
        this.http2SecureServer = null;
        this.http2Server = null;
        this.injector = injector;
        this.config = config;
        this.http2SecureSessions = [];
        this.http2Sessions = [];
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
            await new Promise((resolve, reject) => { // TODO need a refacto
                let session;
                while (session = this.http2SecureSessions.shift()) {
                    session.destroy();
                }
                this.http2SecureServer.close();
                resolve();
            });
            this.emit("close", { server: "http2", port: this.config.http2.port });
        }
        if (this.http2Server) {
            await new Promise((resolve, reject) => { // TODO need a refacto
                let session;
                while (session = this.http2Sessions.shift()) {
                    session.destroy();
                }
                this.http2Server.close();
                resolve();
            });
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

    /**
     * Default http error handler.Is it possible to listen error event to modify it.
     */
    handleError(error, context, stream, headers, flags) {
        const { statusCode = 500, message } = error;
        if (!stream.headersSent) {
            if (this.listenerCount("error")) this.emit("error", error, context, stream, headers, flags);
            else {
                stream
                    .out("object")
                    .respond({
                        statusCode,
                        contentType: "application/json"
                    })
                    .end({ message });
            }
        }
        else {
            // if header already sent (chunk already succeeded),.
            console.error(`Error after headers sent ${context.method}:${context.url}`, error.stack ? error.stack : error.message);
            // stream.abort(error);
            stream.addTrailers({
                status: statusCode,
                error: message,
            }).end();
        }
    }

    async invoke(request, response) {
        const router = await this.injector.resolve("http-router");
        const factory = await this.injector.resolve("context-factory");
        const {
            headers,
            method,
            url
        } = request;
        const context = factory.getContext(method, url);
        const stream = await factory.getStream(request, response, headers);

        const d = domain.create();
        d.once('error', error => this.handleError(error, context, stream, headers));
        d.add(request);
        d.add(response);
        d.add(stream);

        d.run(() => {
            router.invoke(context, stream, headers);
        });

        // try {
        //     await router.invoke(context, stream, headers);
        // }
        // catch(error) {
        //     this.handleError(error, context, stream, headers);
        // }      
    };

    async invoke2(stream, headers, flags) {
        const router = await this.injector.resolve("http-router");
        const factory = await this.injector.resolve("context-factory");
        const {
            ":method": method,
            ":path": path,
        } = headers;
        const context = factory.getContext(method, path);
        const wrappedStream = await factory.getStream(stream, stream, headers);

        const d = domain.create();
        d.once('error', error => this.handleError(error, context, wrappedStream, headers, flags));
        d.add(stream);
        d.add(wrappedStream);

        d.run(() => {
            router.invoke(context, wrappedStream, headers, flags);
        });

        /*
        try {
            await router.invoke(context, wrappedStream, headers, flags);
        }
        catch(error) {
            this.handleError(error, context, wrappedStream, headers, flags);
        }
        */
    }

    async createHttpServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Http port`);

        this.httpServer = http.createServer();
        if (config.timeout) this.httpServer.setTimeout(config.timeout);

        if (/true/i.test(config[`redirect-to-http`])) {
            if (!config.host) throw new UndefinedError(`Http host`);

            this.httpServer.on("request", (request, response) => {
            });
        }
        else {
            this.httpServer.on("request", async (request, response) => {
                try {
                    await this.invoke(request, response);
                } 
                catch(error) {
                    console.error(`${request.method}:${request.url}`, error.stack ? error.stack : error.message);
                    exit(this.httpServer);
                }
            });
        }

        await this.httpServer.listen(config.port);
        this.emit("listening", { server: "http", port: config.port });
    }

    async createHttpsServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Https port`);
        if (!config.key) throw new UndefinedError(`Https key`);
        if (!config.cert) throw new UndefinedError(`Https cert`);

        let options = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert),
            ...(config.ca && {
                ca: [
                    fs.readFileSync(config.ca[0]),
                    fs.readFileSync(config.ca[1])
                ]
            }
            )
        };

        this.httpsServer = https.createServer(options);
        if (config.timeout) this.httpsServer.setTimeout(config.timeout);

        this.httpsServer.on("request", async (request, response) => {
            try {
                await this.invoke(request, response);
            } 
            catch(error) {
                console.error(`${request.method}:${request.url}`, error.stack ? error.stack : error.message);
                exit(this.httpsServer);
            }
        });

        await this.httpsServer.listen(config.port);
        this.emit("listening", { server: "https", port: config.port });
    }

    async createHttp2SecureServer(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`Http2 port`);
        if (!config.key) throw new UndefinedError(`Https key`);
        if (!config.cert) throw new UndefinedError(`Https cert`);

        const options = {
            key: fs.readFileSync(config.key),
            cert: fs.readFileSync(config.cert),
            allowHTTP1: !/false/ig.test(config.allowHTTP1)
        };
        this.http2SecureServer = http2.createSecureServer(options);

        if (options.allowHTTP1) {
            this.http2SecureServer.on("request", async (request, response) => {
                if (request.httpVersionMajor > 1) return;
                try {
                    await this.invoke(request, response);
                } 
                catch(error) {
                    console.error(`${request.method}:${request.url}`, error.stack ? error.stack : error.message);
                    exit(this.http2SecureServer);
                }
            });
        }

        this.http2SecureServer.on("stream", async (stream, headers, flags) => {
            try {
                await this.invoke2(stream, headers, flags);
            } 
            catch(error) {
                console.error(`${headers[":method"]}:${headers[":path"]}`, error.stack ? error.stack : error.message);
                exit(this.http2SecureServer);
            }
        });

        this.http2SecureServer.on('session', session => {
            this.http2SecureSessions.push(session.on("close", () => {
                this.http2SecureSessions.splice(this.http2SecureSessions.indexOf(session), 1);
            }));
        });

        this.http2SecureServer.on("error", (err) => {
            console.error(err)
        });
        this.http2SecureServer.on("socketError", (err) => {
            console.error(err)
        });

        await this.http2SecureServer.listen(config.port);
        this.emit("listening", { server: "http2", port: config.port });
    }

    async createHttp2Server(config) {
        if (/false/i.test(config.start)) return;
        if (!config.port) throw new UndefinedError(`http2-unsecure port`);

        const options = {
            allowHTTP1: !/false/ig.test(config.allowHTTP1)
        };
        this.http2Server = http2.createServer(options);
        if (config.timeout) this.http2Server.setTimeout(config.timeout);

        if (options.allowHTTP1) {
            this.http2Server.on("request", async (request, response) => {
                if (request.httpVersionMajor > 1) return;
                try {
                    await this.invoke(request, response);
                } 
                catch(error) {
                    console.error(`${request.method}:${request.url}`, error.stack ? error.stack : error.message);
                    exit(this.http2Server);
                }
            });
        }

        this.http2Server.on("stream", async (stream, headers, flags) => {
            try {
                await this.invoke2(stream, headers, flags);
            } 
            catch(error) {
                console.error(`${headers[":method"]}:${headers[":path"]}`, error.stack ? error.stack : error.message);
                exit(this.http2Server);
            }
        });

        this.http2Server.on('session', session => {
            this.http2Sessions.push(session.on("close", () => {
                this.http2Sessions.splice(this.http2Sessions.indexOf(session), 1);
            }));
        });

        this.http2Server.on("error", (err) => {
            console.error(err)
        });
        this.http2Server.on("socketError", (err) => {
            console.error(err)
        });

        await this.http2Server.listen(config.port);
        this.emit("listening", { server: "http-unsecure", port: config.port });
    }
};

exports = module.exports = HttpServer;