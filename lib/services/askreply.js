const {
    HttpError
} = require("oups");
const ReadableWritable = require("../streams/readable-writable");
const WritableWrapper = require("../streams/writable-wrapper");
const Workflow = require("../streams/workflow");
const {
    Transform,
    PassThrough,
} = require("stream");
const FileType = require("file-type");
const Busboy = require("busboy");
const { OutgoingMessage } = require("http");
const {
    createDeflate,
    createGzip,
    createBrotliCompress
} = require("zlib");
const ReadableWrapper = require("../streams/readable-wrapper");

class AskReply extends ReadableWritable {

    constructor(giveme, request, response, headers, options) {
        options.allowHalfOpen = true;
        options.decodeStrings = false;
        options.autoDestroy = false;

        super(null, null, options);
        this.options = options;
        const atime = new Date(Date.now());

        this.giveme = giveme;
        this.request = request;
        this.response = response;

        this.requestHeaders = headers;
        this.statusCode = 200;
        this.headers = {
            "date": atime.toUTCString(),
            "cache-control": "no-cache",
            "expires": atime.toUTCString(),
            "set-cookie": "flavor=choco; SameSite=Lax",
            "x-content-type-options": "nosniff",
            "x-frame-options": "deny",
            "trailer": "error,status"
        };
        const { ["accept-encoding"]: acceptEncoding } = this.requestHeaders;

        if (/\bgzip\b/.test(acceptEncoding)) this.headers["content-encoding"] = "gzip";
        // br est très très très lent.
        // if (/\bbr\b/.test(acceptEncoding)) this.headers["content-encoding"] = "br";
        // deflate semble avoir un bug.
        // if (/\bdeflate\b/.test(acceptEncoding)) this.headers["content-encoding"] = "deflate";

        this.readableMode = "array";
        this.writableMode = "array";
    }

    async mount() {
        this.jsonStream = await this.giveme.resolve("json-stream");
        this.textStream = await this.giveme.resolve("text-stream");
    }

    onReadableError(error) {
        this.sendNativeError(error);
    }

    // overide default pipline
    get readableStreams() {
        const self = this;
        return function* () {
            // yield this.request;
            // yield self.jsonStream.parse({ isArray: true, source: "ask" })
            /**
             * Je peux uiliser un Workflow, si request est à l'exterieur (avant)
             * ou un ReadableWrapper si request est à l'interieur
             */
            yield new ReadableWrapper(function* () {
                yield self.request;

                const { ["content-type"]: contentType } = self.requestHeaders;
                const mime = contentType?.split(":")?.shift();

                if (/\bapplication\/json\b/.test(mime)) {
                    const isArray = self.readableMode === "array";
                    yield self.jsonStream.parse({ isArray, source: "ask" })
                }
                if (/\bmultipart\/form-data\b/.test(mime)) {
                    try {
                        const busboy = new Busboy({ headers: self.requestHeaders });
                        busboy.on("file", (...args) => {
                            self.emit("file", ...args);
                        });
                        busboy.on("field", (...args) => {
                            self.emit("field", ...args);
                        });
                        /**
                         * busboy est Writable. Je ne peux pas l'ajouter au pipeline (duplex).
                         * J'utilise un passthrough pour cela.
                         * BUG busboy ne termine jamais le flux d'écriure, je n'utilise pas pipe
                         */
                        const passthrough = new PassThrough();
                        passthrough
                            .on("data", chunk => {
                                busboy.write(chunk)
                            })
                            .on("error", error => {
                                this.emit("error", error);
                            })
                            .on("end", () => {
                                busboy.end();
                            });

                        yield passthrough;
                    } catch (error) {
                        this.sendNativeError(error);
                    }
                }
            }, { objectMode: self.options.readableObjectMode });
        };
    }

    onWritableError(error) {
        this.sendNativeError(error);
    }

    // overide default pipline
    get writableStreams() {
        const self = this;
        let headerSent = false;
        return function* () {
            yield new Transform({
                objectMode: self.options.writableObjectMode ?? self.options.objectMode,
                transform(chunk, encoding, callback) {
                    process.nextTick(async () => {
                        try {
                            if (!headerSent) {
                                headerSent = true;
                                await self.detectContentType(chunk);
                                self.writeHead();
                            }
                            callback(null, chunk);
                        }
                        catch (error) {
                            callback(error);
                        }
                    });
                },
                async final(callback) {
                    try {
                        /**
                         * Si le flux en lecture est vide.
                         * ex: vide en base de donnée etje veux renvoyerun JSON array vide.
                         */
                        if (!headerSent) {
                            headerSent = true;
                            await self.detectContentType();
                            self.writeHead();
                        }
                        callback();
                    }
                    catch (error) {
                        callback(error);
                    }
                }
            });
            /**
             * Je peux uiliser un Workflow, si reponse est à l'exterieur (après)
             * Ou un WritableWrapper si reponse est à l'interieur
             */
            yield new WritableWrapper(function* () {
            // yield new Workflow(function* () {
                const { ["content-type"]: contentType, ["content-encoding"]: contentEncoding } = self.headers;

                // Serialization
                if (/\bapplication\/json\b/.test(contentType)) {
                    const isArray = self.writableMode === "array";
                    yield self.jsonStream.stringify({ isArray, source: "reply" })
                }
                if (/\btext\/html\b/.test(contentType)) {
                    const isArray = self.writableMode === "array";
                    yield self.textStream.stringify({ isArray, source: "reply" });
                }

                // Compression
                if (contentEncoding === "br") {
                    yield createBrotliCompress();
                }
                else if (contentEncoding === "gzip") {
                    yield createGzip()
                }
                else if (contentEncoding === "deflate") {
                    yield createDeflate();
                }
                
                yield self.response;
            }, { objectMode: self.options.writableObjectMode});
            // yield self.jsonStream.stringify({ isArray: true, source: "reply" });
            // yield this.response;
        };

    }

    // HTTP stream

    writeHead() {
        const { ["content-type"]: contentType } = this.headers;

        // ajout du charset
        if (["application/json", "text/html"].some(e => e === contentType) && /charset/.test(this.headers["content-type"]) == false)
            this.headers["content-type"] += "; charset=utf-8";

        // HTTP/1
        if (this.response instanceof OutgoingMessage) {
            this.response.writeHead(this.statusCode, this.headers);
        }
        // HTTP/2
        else {
            this.response.respond({
                ...this.headers,
                ':status': this.statusCode
            });
        }
    }

    /**
     * J'essaye de déterminer content-type
     */
    async detectContentType(chunk) {
        if (this.headers["content-type"]) return;
        if (chunk instanceof Uint8Array || chunk instanceof ArrayBuffer || Buffer.isBuffer(chunk)) {
            const filetype = await FileType.fromBuffer(chunk);
            if (filetype) this.headers["content-type"] = filetype.mime;
        }
        else if (chunk instanceof Object || chunk instanceof Array || (chunk === undefined && ["GET", "POST", "PUT", "DELETE", "PATCH"].some(e => e == this.method))) {
            this.headers["content-type"] = "application/json";
            return;
        }
        else if (this.requestHeaders["accept"]) {
            const accepts = this.requestHeaders["accept"].split(",");
            if (accepts.length == 1) {
                const accept = accepts.shift();
                const tokens = accept.split("/");
                if (tokens[1] !== "*" && tokens[0] !== "*") {
                    this.headers["content-type"] = accept;
                    return;
                }
            }
        }
    }

    /**
     * Respond like HTTP/2
     * @param {*} value 
     */
    respond(value = {}, force = false) {

        const { statusCode, contentType, ...customHeaders } = value;
        if (contentType) customHeaders["content-type"] = contentType; // syntax sugar

        // Le header dans this.response va être écrasé.
        this.statusCode = statusCode ?? this.statusCode
        this.headers = force ?
            customHeaders :
            {
                ...this.headers,
                ...customHeaders
            };

        return this;
    }

    /**
     * End peut avoir un chunk
     */
    end(chunk) {
        if (chunk instanceof Error) {
            this.sendError(chunk);
            return;
        }
        if (chunk) this.write(chunk);
        return super.end();
    }

    /** 
     * Gestion du mode de serialization (object|array)
    */

    mode(mode) {
        return this.in(mode).out(mode);
    }

    in(mode) {
        this.readableMode = mode;
        return this;
    }

    out(mode) {
        if (this.writableMode == mode) return this;
        this.writableMode = mode;
        return this;
    }

    get method() {
        // HTTP/1
        if (this.response instanceof OutgoingMessage) return this.request.method;
        // HTTP/2
        return this.requestHeaders[":method"];
    }

    get url() {
        // HTTP/1
        if (this.response instanceof OutgoingMessage) return this.request.url;
        // HTTP/2
        return this.requestHeaders[":path"];
    }

    addTrailers(data) {
        this.response.addTrailers(data);
    }

    setTimeout(timeout, callback) {
        this.response.setTimeout(timeout, callback);
    }

    redirect(url, headers = {}) {
        this.respond({
            statusCode: 307,
            Location: encodeURI(url),
            contentType: this.headers["content-type"] || "text/html",
            ...headers
        }).end();
    };

    async forward(method, url, headers) {
        const router = await this.giveme.resolve("http-router");
        const contextFactory = await this.giveme.resolve("context-factory");
        const forwardContext = contextFactory.getContext(method, url);
        const route = await router.getRoute(forwardContext);
        if (!route) {
            throw new HttpError(404, "${method}:${pathname} doesn't exist.", forwardContext);
        }
        return await route.router.invoke(forwardContext, this, headers);
    }

    sendNativeError(error) {
        const { message, stack, statusCode } = error;
        console.error(`Send native error ${this.method}:${this.url}`, stack ? stack : message);

        if (this.response instanceof OutgoingMessage) {
            this.response.writeHead(statusCode ?? 500);
            this.response.end();
        }
        else {
            this.response.respond({
                ':status': 500
            });
            this.response.end();
        }
        // Ne pas faire de destroy sinon bug
    }

    sendError(error, options = {}) {
        const { message, statusCode } = error;
        if (this.writableHandlersSetup) {
            this.sendNativeError(error);
        }
        else {
            try {
                this.respond({
                    statusCode: statusCode ?? 500,
                    contentType: "application/json"
                }).end({ message });
            }
            catch (error) {
                this.sendNativeError(error);
            }
        }
    }
}

module.exports = AskReply;