const ReadableWritable = require("../streams/readable-writable");
const {
    pipeline, PassThrough,
} = require("stream");
const { OutgoingMessage } = require("http");
const { 
    createDeflate, 
    createGzip, 
    createBrotliCompress 
} = require("zlib");
const Busboy = require("busboy");
const FileType = require("file-type")

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

    // override
    get readableStream() {
        if (this._readableStream) return this._readableStream;

        // this._readableStream = pipeline(this.request, JSONStream.parse("*"), err => {});
        // return this._readableStream; 

        const pipelines = [this.request];

        const { ["content-type"]: contentType } = this.requestHeaders;
        const mime = contentType?.split(":")?.shift();

        if (/\bapplication\/json\b/.test(mime)) {
            const isArray = this.readableMode === "array";
            const source = "ask";
            pipelines.push(this.jsonStream.parse({ isArray, source }));
        }
        if (/\bmultipart\/form-data\b/.test(mime)) {
            try {
                const busboy = new Busboy({ headers: this.requestHeaders });
                busboy.on("file", (...args) => {
                    this.emit("file", ...args);
                });
                busboy.on("field", (...args) => {
                    this.emit("field", ...args);
                });
                pipelines.push(busboy);
            } catch(error) {
                // Busboy peut emettre des erreurs.
                // TODO vérifier si emit(error) est ok.
                this.emit("error", error);
            }
        }

        if (pipelines.length > 1) {
            this._readableStream = pipeline(
                ...pipelines,
                err => {
                    // La socket est automatiquement fermée. Inutile de propager l'erreur.
                    // Tester avec helloworld.js
                    if (err) {
                        console.error("ReadableStream pipeline error", err);
                    }
                }
            );
        }
        else this._readableStream = pipelines[0];

        return this._readableStream;
    }

    /**
     * writableStream sera toujours appelé après writeHead.
     */
    get writableStream() {
        if (this._writableStream) return this._writableStream;

        const pipelines = [];
        const { ["content-type"]: contentType, ["content-encoding"]: contentEncoding } = this.headers;
        // const objectMode = ["array", "object"].some(e => e === this.writableMode);
        const isArray = this.writableMode === "array";
        const source = "reply";

        // Serialization
        if (contentType === "application/json") {
            pipelines.push(this.jsonStream.stringify({ isArray, source }))
        }
        if (contentType === "text/html") {
            pipelines.push(this.textStream.stringify({ isArray, source }))
        }
        
        // Compression
        if (contentEncoding === "br") {
            pipelines.push(createBrotliCompress());
        }
        if (contentEncoding === "gzip") {
            pipelines.push(createGzip());
        }
        if (contentEncoding === "defalte") {
            pipelines.push(createDeflate());
        }
        
        pipelines.push(this.response);

        this._writableStream = pipelines[0];

        if (pipelines.length > 1) {
            pipeline(
                ...pipelines,
                err => {
                    // http-server va fermer la requête. Inutile de propager l'erreur.
                    // Tester avec helloworld.js
                    if (err) {
                        console.error("WritableStream pipeline error", err);
                    }
                }
            );
        }

        // Le pipeline est créé, je peux envoyer le statusCode et le header.
        // this.response.writeHead(this.statusCode, this.headers);

        return this._writableStream;
    }

    // HTTP stream

    writeHead(chunk) {
        
        // Je peux analyser chunk pour détecter le content-type;
        if (!this.headers["content-type"]) {
            this.detectContentType(chunk);
        }

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

        this.writeHeadCompleted = true;
    }

    /*
    getWritableNextChunk() {
        // doit retourner null
        return this.writableChunks.shift() ?? null;
    }

    writableFlow() {
        try {
            let item;
            while (null !== (item = this.getWritableNextChunk())) {
                // if push returns false, stop writing
                const { chunk, enc, callback, ended } = item;
                if (ended) {
                    super.end();
                }
                else
                    super.write(chunk, enc, callback);
            }
        }
        catch (error) {
            // IMPORTANT je transmet l'erreur. ex TypeError [ERR_INVALID_ARG_TYPE] Wrong chunck type
            // Pour que http-server gére l'erreur.
            this.emit("error", error);
        }
    };

    writableAddChunk(chunk) {
        if (!this._writableStream) {
            this.detectContentType(chunk);
            this.writeHead();
        }
        this.writableChunks.push(chunk);
    }
    */

    /**
     * J'essaye de déterminer content-type
     * IMPORTANT: Ne peut pas êre asynchrone.
     */
    detectContentType(chunk) {
        if (this.headers["content-type"]) return;
        if (chunk instanceof Uint8Array || chunk instanceof ArrayBuffer || Buffer.isBuffer(chunk)) {
            // const filetype = await FileType.fromBuffer(chunk);
            // if (filetype) this.headers["content-type"] = filetype.mime;
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

        this.emit("error", new Error("Content-Type is not defined."));
    }


    write(chunk, enc, callback) {
        return super.write(chunk, enc, callback);
    }

    end(chunk) {
        if (!this._writableStream) {
            this.detectContentType(chunk);
            this.writeHead();
        }
        return super.end(chunk);
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