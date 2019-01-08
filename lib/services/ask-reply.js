/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    PassThrough,
    Readable,
    Duplex,
    pipeline
} = require("stream");
const zlib = require("zlib");
const Busboy = require("busboy");
const { EventEmitter } = require('events');
const fileType = require("file-type");
const { OutgoingMessage } = require("http");

const kRequest = Symbol("request");
const kResponse = Symbol("response");
const kRequestHeaders = Symbol("requestheaders");
const kResponseHeaders = Symbol("responseheaders");
const kResponseStart = Symbol("responseStart");
const kReadableMode = Symbol("readablemode");
const kWritableMode = Symbol("writablemode");
const kStatusCode = Symbol("statusCode");
const kJsonStream = Symbol("jsonStream");

EventEmitter.defaultMaxListeners = 32; //increase default max listeners

const EElistenerCount = (emitter, type) => {
    return emitter.listeners(type).length;
};

class AskReply extends Duplex {

    /**
     * KRequest, ..., kReadableStream.
     * kWritableStream, ..., kRequest
     */
    constructor(giveme, request, response, headers) {
        super({ objectMode: true });
        const atime = new Date(Date.now());
        request.pause();
        this.giveme = giveme;
        this[kRequest] = request;
        this[kResponse] = response; //temp this.response for debug
        this[kRequestHeaders] = headers;

        this[kResponseStart] = new InnerReadable({ objectMode: true }); //I don't known sink, so we use a pass throught stream

        this[kReadableMode] = "array";
        this[kWritableMode] = "array";

        this[kStatusCode] = 200;

        this[kJsonStream] = null;

        this[kResponseHeaders] = {
            "date": atime.toUTCString(),
            "cache-control": "no-cache",
            "expires": atime.toUTCString(),
            "x-content-type-options": "nosniff",
            "x-frame-options": "deny"
        };
        const acceptEncoding = this[kRequestHeaders]["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this[kResponseHeaders]["content-encoding"] = "gzip";
        if (/deflate/.test(acceptEncoding)) this[kResponseHeaders]["content-encoding"] = "deflate";

        this.once("readableinit", () => { // create pipeline to read the request
            this[kRequest] // request shouldn't be destroyed. Because an http error wil be sent. destroy will close the socket
                .pipe(this.requestTransform)
                .on("data", data => {
                    this.emit("data", data);
                })
                .on("end", () => {
                    this.emit("end");
                })
                .on("error", error => {
                    this.emit("error", error);
                })
        });

        this.once("writableinit", (chunk) => {
            this.detectContentType(chunk);
        });

        this.once("writableinit", () => { // create pipeline to write the response
            pipeline(
                this[kResponseStart],
                this.responseTransform,
                this.compress
                    .once("data", () => this.writeHead())
                    .once("end", () => this.writeHead())
                ,
                this[kResponse],
                error => error && this.emit("error", error)
            );
        });
    }

    async mount() {
        this[kJsonStream] = await this.giveme.resolve("json-stream");
    }

    get requestTransform() {
        const contentType = this[kRequestHeaders]["content-type"];
        const mime = contentType ? contentType.split(":").shift() : null;

        if (/application\/json/.test(mime)) {
            const isArray = this[kReadableMode] == "array";
            const source = "ask";
            return this[kJsonStream].parse({ isArray, source });
        }

        if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", (...args) => {
                this.emit("file", ...args)
            });
            busboy.on("field", (...args) => {
                this.emit("field", ...args)
            });
            return busboy;
        }

        const objectMode = ["array", "object"].some(e => e == this[kReadableMode]);
        return new PassThrough({ objectMode });
    }

    get responseTransform() {
        const headers = this[kResponseHeaders];
        const contentType = headers["content-type"];
        if (/application\/json/.test(contentType)) {
            if (/charset/.test(headers["content-type"]) == false) headers["content-type"] += "; charset=utf-8";

            const isArray = this[kWritableMode] == "array";
            const source = "reply";
            return this[kJsonStream].stringify({ isArray, source });
        }
        else if (/text\/html/.test(contentType)) {
            if (/charset/.test(headers["content-type"]) == false) headers["content-type"] += "; charset=utf-8";
        }
        const objectMode = ["array", "object"].some(e => e == this[kWritableMode]);
        return new PassThrough({ objectMode });
    }

    get compress() {
        const headers = this[kResponseHeaders];
        const contentEncoding = headers["content-encoding"];
        if (/gzip/.test(contentEncoding)) return zlib.createGzip();
        if (/deflate/.test(contentEncoding)) return zlib.createDeflate();
        return new PassThrough();
    }

    detectContentType(chunk) {
        if (this[kResponseHeaders]["content-type"]) return;

        if (chunk instanceof Uint8Array || Buffer.isBuffer(chunk)) {
            const filetype = fileType(chunk);
            if (filetype) this[kResponseHeaders]["content-type"] = filetype.mime;
        }
        else if (chunk instanceof Object || chunk instanceof Array || chunk === undefined) {
            this[kResponseHeaders]["content-type"] = "application/json";
        }
        else if (this[kRequestHeaders]["accept"]) {
            const accepts = this[kRequestHeaders]["accept"].split(",");
            if (accepts.length == 1) this[kResponseHeaders]["content-type"] = accepts.shift();
        }
    }

    writeHead() {
        if (!this[kResponse].headersSent) {
            if (this[kResponse] instanceof OutgoingMessage) {
                this[kResponse].writeHead(this[kStatusCode], this[kResponseHeaders]);
            }
            else {
                this[kResponse].respond({
                    ...this[kResponseHeaders],
                    ':status': this[kStatusCode]
                });
            }
        }
    }

    /* respond like http2 */

    respond(value) {
        const { statusCode, ...headers } = value;
        if (statusCode) this[kStatusCode] = statusCode;
        if (headers) {
            const { contentType, ...others } = value;
            this[kResponseHeaders] = {
                ...this[kResponseHeaders],
                ...others
            };
            if (contentType) this[kResponseHeaders]["content-type"] = contentType; //syntax sugar
        }
        return this;
    }


    get unwrap() {
        const request = this[kRequest];
        const response = this[kResponse];
        return { request, response };
    }

    /* mode */

    mode(mode) {
        return this.in(mode).out(mode);
    }

    in(mode) {
        this[kReadableMode] = mode;
        return this;
    }

    out(mode) {
        if (this[kWritableMode] == mode) return this;
        this[kWritableMode] = mode;
        const objectMode = ["array", "object"].some(e => e == mode);
        this[kResponseStart] = new InnerReadable({ objectMode }); // Regenerate PassThrough stream becasue objectMode may has changed
        return this;
    }

    redirect(url) {
        this.respond({
            statusCode: 307,
            Location: encodeURI(url),
            contentType: this[kResponseHeaders]["content-type"] || "text/html"
        }).end();
    };

    async forward(method, url, headers) {
        const httpRouter = await this.giveme.resolve("http-router");
        const contextFactory = await this.giveme.resolve("context-factory");
        const forwardContext = contextFactory.getContext(method, url);
        return await httpRouter.invoke(forwardContext, this, headers);
    }

    /* STREAM */

    /* Readable & Writable others */
    on(ev, fn) {
        const res = super.on(ev, fn);
        if (ev == "file") {                                 // "file" is not a standard event. We need to start flowing.
            if (this._readableState.flowing !== false)      // Start flowing on next tick if stream isn"t explicitly paused.
                this.resume();
        }
        return res;
    }

    /* Readable */
    _read(size) {
        this.emit("readableinit");
    }

    /* Writable*/

    // override default method
    write(chunk, encoding, callback) {
        this.emit("writableinit", chunk);
        const ret = this[kResponseStart].push(chunk);
        if (!ret) {
            const listeners = EElistenerCount(this[kResponseStart], "drained"); // callback are undefined. Write is not stopped.
            if (listeners == 0) {
                this[kResponseStart].once("drained", () => {
                    this.emit("drain");
                });
            }
        }
        return ret;
    }

    // override default method. We mustn't emit the finish event, it will be fire when the response ending.
    end(data) {
        this.emit("writableinit", data);
        if (data) this[kResponseStart].push(data);
        this[kResponseStart].push(null);
    }
};

class InnerReadable extends Readable {

    pipe(dest) {
        const ret = super.pipe(dest);
        dest.on("drain", () => {
            this.emit("drained");
        });
        dest.on("resume", () => {
            this.emit("drained");
        });
        return ret;
    }

    _read(n) {
    }
}

module.exports = AskReply;
