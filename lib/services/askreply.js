const ReadableWritable = require("../streams/readable-writable");
const TransformWrapper = require("../streams/transform-wrapper");
const {
    pipeline, Transform, PassThrough,
} = require("stream");
const { OutgoingMessage } = require("http");
const { 
    createDeflate, 
    createGzip, 
    createBrotliCompress 
} = require("zlib");
const Busboy = require("busboy");
const { response } = require("express");

class AskReply extends ReadableWritable {

    constructor(giveme, request, response, headers, options) {
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
        if (/\bdeflate\b/.test(acceptEncoding)) this.headers["content-encoding"] = "deflate";
        if (/\bbr\b/.test(acceptEncoding)) this.headers["content-encoding"] = "br";

        this.readableMode = "array";
        this.writableMode = "array";
    }

    async mount() {
        this.jsonStream = await this.giveme.resolve("json-stream");
        this.textStream = await this.giveme.resolve("text-stream");
    }

    // overide default pipline
    get readableStreams() {
        const self = this;
        return function* () {
            yield this.request.on("end", () => {
                console.log("request_end")
            });
            yield new TransformWrapper(function* () {
                
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
                        yield busboy;
                    } catch(error) {
                        // Busboy peut emettre des erreurs.
                        // TODO vérifier si emit(error) est ok.
                        self.emit("error", error);
                    }
                }
            }, { objectMode: this.options.readableObjectMode ?? this.options.objectMode }
            ).on("end", () => {
                console.log("request_end")
            });;
        };
    }

    // overide default pipline
    get writableStreams() {
        const self = this;
        let detect = true;
        return function* () {
            yield new Transform({
                objectMode: self.options.writableObjectMode ?? self.options.objectMode,
                async transform(chunk, encoding, callback) {
                    try {
                        if (detect) {
                            await self.detectContentType(chunk);
                            detect = true
                        }
                        callback(null, chunk);
                    }
                    catch(error) {
                        callback(error);
                    }
                }
            });
            yield new TransformWrapper(function* () {

                const { ["content-type"]: contentType, ["content-encoding"]: contentEncoding } = self.headers;
                
                // Serialization
                if (/\bapplication\/json\b/.test(contentType)) {
                    const isArray = self.writableMode === "array";
                    yield self.jsonStream.stringify({ isArray, source: "reply" });
                }
                if (/\btext\/html\b/.test(contentType)) {
                    const isArray = self.writableMode === "array";
                    yield self.textStream.stringify({ isArray, source: "reply" });
                }

                // Compression
                if (contentEncoding === "br") {
                    yield createBrotliCompress();
                }
                if (contentEncoding === "gzip") {
                    yield createGzip();
                }
                if (contentEncoding === "deflate") {
                    yield createDeflate();
                }
            });
            yield self.response;
        };

    }

    writableSetup() {
        super.writableSetup();
        this.writeHead();
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
            return ;
        }
        else if (this.requestHeaders["accept"]) {
            const accepts = this.requestHeaders["accept"].split(",");
            if (accepts.length == 1) {
                const accept = accepts.shift();
                const tokens = accept.split("/");
                if (tokens[1] !== "*" && tokens[0] !== "*" ) {
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
}

module.exports = AskReply;