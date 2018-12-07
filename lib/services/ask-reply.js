/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    UndefinedError,
} = require("oups");
const {
    PassThrough,
} = require("stream");
const zlib = require("zlib");
const Busboy = require("busboy");
const process = require("process");
const { EventEmitter } = require('events');
const fileType = require("file-type");

const kRequest = Symbol("request");
const kResponse = Symbol("response");
const kRequestHeaders = Symbol("requestheaders");
const kResponseHeaders = Symbol("responseheaders");
const kReadableStreamCurrent = Symbol("readablestreamcurrent");
const kReadableStreamEnd = Symbol("readablestreamend");
const kWritableStreamStart = Symbol("writablestreamstart");
const kWritableStreamCurrent = Symbol("writablestreamcurrent");
const kReadableInit = Symbol("readableinit");
const kWritableInit = Symbol("writableinit");
const kReadableMode = Symbol("readablemode");
const kWritableMode = Symbol("writablemode");
const kStatusCode = Symbol("statusCode");
const kJsonStream = Symbol("jsonStream");

EventEmitter.defaultMaxListeners = 15; //increase default max listeners

class AskReply extends PassThrough {

    /**
     * KRequest, ..., kReadableStream.
     * kWritableStream, ..., kRequest
     */
    constructor(giveme, request, response, headers) {
        if (!giveme) throw new UndefinedError("giveme");
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });
        const atime = new Date(Date.now());
        request.pause();
        this.giveme = giveme;
        this[kRequest] = request;
        this[kResponse] = this.response = response; //temp this.response for debug
        this[kRequestHeaders] = headers;

        this[kReadableStreamCurrent] = this[kRequest];
        this[kReadableStreamEnd] = null;
        this[kWritableStreamStart] = new PassThrough({ objectMode: true }); //I don't known sink, so we use a pass throught stream
        this[kWritableStreamCurrent] = null;

        this[kReadableInit] = false;
        this[kWritableInit] = false;
        this[kReadableMode] = "array";
        this[kWritableMode] = "array";

        this[kStatusCode] = 200;

        this[kJsonStream] = null;

        this[kResponseHeaders] = {
            "Date": atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": headers["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
        };
        const acceptEncoding = this[kRequestHeaders]["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "gzip";
        if (/deflate/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "deflate";

        this.once("readableinit", async () => this.onceReadableInit());
        this.once("writableinit", (chunk, encoding) => this.detectContentType(chunk, encoding));
        this.once("writableinit", (chunk, encoding) => this.onceWritableInit(chunk, encoding));
    }

    async mount() {
        this[kJsonStream] = await this.giveme.resolve("json-stream");
    }

    onceReadableInit() {
        const contentType = this[kRequestHeaders]["content-type"];
        const mime = contentType ? contentType.split(":").shift() : null;

        if (/application\/json/.test(mime)) {
            const isArray = this[kReadableMode] == "array";
            const source = "ask";
            const next = this[kJsonStream].parse({ isArray, source });
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(next);
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", (...args) => {
                this.emit("file", ...args)
            });
            busboy.on("field", (...args) => {
                this.emit("field", ...args)
            });
            const next = busboy;
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(next);
        }
        else {
            const objectMode = ["array", "object"].some(e => e == this[kReadableMode]);
            const next = new PassThrough({ objectMode });
            this[kReadableStreamCurrent].once("error", error => next.emit("error", error));
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(next);
        }

        this[kReadableStreamEnd] = this[kReadableStreamCurrent];

        this[kReadableStreamEnd].on("data", data => {
            this.push(data);
        });
        this[kReadableStreamEnd].on("end", () => {
            this.push(null);
			const { awaitDrain } = this._readableState;
            if (awaitDrain) 
                this.resume();
        });
        this[kReadableStreamEnd].on("error", error => {
            this.emit("error", error);
        });

        this[kReadableInit] = true;
        this.resume();
    }

    detectContentType(chunk, encoding) {
        if (this[kResponseHeaders]["Content-Type"]) return;

        if (chunk instanceof Uint8Array || Buffer.isBuffer(chunk)) {
            const filetype = fileType(chunk);
            if (filetype) this[kResponseHeaders]["Content-Type"] = filetype.mime;
        }
        else if (chunk instanceof Object || chunk instanceof Array || chunk === undefined) {
            this[kResponseHeaders]["Content-Type"] = "application/json";
        }
        else if (this[kRequestHeaders]["accept"]) {
            const accepts = this[kRequestHeaders]["accept"].split(",");
            if (accepts.length == 1) this[kResponseHeaders]["Content-Type"] = accepts.shift();
        }
    }

    onceWritableInit(chunk, encoding) {

        this[kWritableStreamCurrent] = this[kWritableStreamStart];

        const headers = this[kResponseHeaders];
        const contentType = headers["Content-Type"];

        if (/application\/json/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
            const isArray = this[kWritableMode] == "array";
            const source = "reply";
            const next = this[kJsonStream].stringify({ isArray, source });
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(next);
        }
        else if (/text\/html/.test(contentType)) {
            if (/charset/.test(headers["Content-Type"]) == false) headers["Content-Type"] += "; charset=utf-8";
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            const next = zlib.createGzip();
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(next);
        }
        if (/deflate/.test(contentEncoding)) {
            const next = zlib.createDeflate();
            this[kWritableStreamCurrent].once("error", error => next.emit("error", error));
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(next);
        }

        this[kWritableStreamCurrent]
            .once("data", data => {
                if (!this[kResponse].headersSent)
                    this[kResponse].writeHead(this[kStatusCode], headers);
            })
            .once("end", () => {
                if (!this[kResponse].headersSent)
                    this[kResponse].writeHead(this[kStatusCode], headers);
            })
            .once("error", error => {
                this.emit("error", error);
            })
            .on("drain", () => {
                this.emit("drain"); 	//force src of ask-reply to read.
            })
            .pipe(this[kResponse])
            .once("finish", () => {
                this.emit("finish"); 	//emit finish to respect response interface.
            })
            .once("close", () => {
                this.emit("close"); 	//emit close to respect response interface (must not appear).
            });

        this[kWritableInit] = true;

        this.emit("drain"); 	//force src of ask-reply to read beacause write method has stop reading.
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
            if (contentType) this[kResponseHeaders]["Content-Type"] = contentType; //syntax sugar
        }
        return this;
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
        this[kWritableStreamStart] = new PassThrough({ objectMode }); //Regenerate PassThrough stream becasue objectMode may has changed
        return this;
    }

    redirect(url) {
        if (this[kWritableInit]) {
            console.error(`Failed to redirect to ${url}, beacause response is already sending.`);
            return;
        }

        this[kStatusCode] = 307;
        this[kResponseHeaders]["Location"] = encodeURI(url);
        if (!this[kResponseHeaders]["Content-Type"]) this[kResponseHeaders]["Content-Type"] = "text/html";
        this.emit("writableinit");
        this[kWritableStreamStart].push(null);
    };

    async forward(method, url, headers) {
        const httpRouter = await this.giveme.resolve("http-router");
        const contextFactory = await this.giveme.resolve("context-factory");
        const forwardContext = contextFactory.getContext(method, url);
        return await httpRouter.invoke(forwardContext, this, headers);
    }

    /* STREAM */

    pipe(src) {  // ex: s1.pipe(stream) error in s1 will be catch
        src.once("error", error => {
            this.emit("error", error);
        });
        return super.pipe(src);
    }

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
        if (!this[kReadableInit]) {                         // Create the pipe workflow on first read. After that we don't need to do anything. Pipe will do the job.
            this.pause();                                   // Stop flowing.
            process.nextTick(() => this.emit("readableinit"));
            return null;                                    // Return null to stop reading
        }
    }

    /* Writable*/

    // override default method
    write(chunk, encoding, callback) {
        const noDrain = this[kWritableStreamStart].push(chunk);
        if (!this[kWritableInit]) {
            process.nextTick(() => this.emit("writableinit", chunk, encoding));
            return false; //need to send a drain event
        }
        return noDrain;
    }

    // override default method. We mustn't emit the finish event, it will be fire when the response ending.
    end(chunk, encoding, callback) {
        if (!this[kWritableInit]) {                         // if pipe workflow is not created
            process.nextTick(() => {
                this.emit("writableinit", chunk, encoding);
                if (chunk) this[kWritableStreamStart].push(chunk);
                this[kWritableStreamStart].push(null);      // Ending the readeable stream
            });
            return;
        }

        if (chunk) this[kWritableStreamStart].push(chunk);
        this[kWritableStreamStart].push(null);
    }
};

module.exports = AskReply;
