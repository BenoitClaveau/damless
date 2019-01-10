/*!
 * damless
 * Copyright(c) 2019 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    transform, 
    noop 
} = require("../../core/streamify");

class TextStreamService {
    constructor() {
    }

    stringify(options = {}) {
        return transform((chunk, encoding) => {
            if (typeof chunk == "string") return chunk;
            if (Buffer.isBuffer(chunk)) return chunk;
            return chunk.toString();
        });
    }

    parse(options = {}) {
        return noop();
    }
}

exports = module.exports = TextStreamService;