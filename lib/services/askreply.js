const ReadableWritable = require("../streams/readable-writable");
const ReadableWrapper = require("../streams/readable-wrapper");
const {
    PassThrough,
    Readable,
    Duplex,
    pipeline,
    Transform
} = require("stream");
const JSONStream = require("JSONStream");

class AskReply extends ReadableWritable {

    constructor(giveme, request, response, headers, options) {
        super(null, null, options);
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
        if (acceptEncoding === "gzip") this.headers["content-encoding"] = "gzip";
        if (acceptEncoding === "deflate") this.headers["content-encoding"] = "deflate";

        this.readableMode = "array";
        this.writableMode = "array";
    }

    async mount() {
        this.jsonStream = await this.giveme.resolve("json-stream");
        this.textStream = await this.giveme.resolve("text-stream");
    }

    // override
    get readableStream() {
        if (this._readableStream) return this._readableStream;

        const pipelines = [this.request];

        const { ["content-type"]: contentType } = this.requestHeaders;
        const mime = contentType?.split(":")?.shift();

        if (mime === "application/json") {
            const isArray = this.readableMode === "array";
            const source = "ask";
            pipelines.push(this.jsonStream.parse({ isArray, source }))
        }

        this._readableStream = pipeline(
            ...pipelines,
            err => {
                // La socket est automatiquement fermée. Inutile de propager l'erreur.
                // Tester avec helloworld.js
                if (err) console.error("ReadableStream pipeline error", err);
            }
        );
        return this._readableStream;
    }

    get writableStream() {
        if (this._writableStream) return this._writableStream;

        const pipelines = [];
        const { ["content-type"]: contentType } = this.headers;
        // const objectMode = ["array", "object"].some(e => e === this.writableMode);
        const isArray = this.writableMode === "array";
        const source = "reply";

        if (contentType === "application/json") {
            if (/charset/.test(this.headers["content-type"]) == false) this.headers["content-type"] += "; charset=utf-8";
            pipelines.push(this.jsonStream.stringify({ isArray, source }))
        }

        if (contentType === "text/html") {
            if (/charset/.test(this.headers["content-type"]) == false) this.headers["content-type"] += "; charset=utf-8";
            pipelines.push(this.textStream.stringify({ isArray, source }))
        }

        pipelines.push(this.response);
        this._writableStream = pipelines[0];

        if (pipelines.length > 1) {
            pipeline(
                ...pipelines,
                err => {
                    // http-server va fermer la requête. Inutile de propager l'erreur.
                    // Tester avec helloworld.js
                    if (err) console.error("WritableStream pipeline error", err);
                }
            );
        }

        
        this.response.writeHead(this.statusCode, this.headers);

        return this._writableStream;
    }

    // fluent
    write(chunk, enc, callback) {
        super.write(chunk, enc, callback);
        return this;
    }

    // fluent + accepte un chunk contrairemen à end (Writable)
    end(chunk) {
        if (chunk) this.write(chunk);
        super.end();
        return this;
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
        // const objectMode = ["array", "object"].some(e => e == mode);
        // TODO
        // this[kResponseStart] = new InnerReadable({ objectMode }); // Regenerate PassThrough stream becasue objectMode may has changed
        return this;
    }
}

module.exports = AskReply;