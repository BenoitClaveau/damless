/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    UndefinedError, 
    Error 
} = require("oups");
const { Transform } = require("stream");
const zlib = require("zlib");
const crypto = require("crypto");

const kStream = Symbol('stream');

class CompressedStream extends Transform {
    
    constructor(stream, headers) {
        if (!stream) throw new UndefinedError("stream");
        if (!headers) throw new UndefinedError("headers");
        super();
        this[kStream] = stream;

        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) this.stream = this.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) this.stream = this.pipe(zlib.createDeflate());
    }

    _transform(chunk, encoding, callback) {
        try {
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }
}

module.exports = CompressedStream;