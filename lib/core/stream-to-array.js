/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Writable } = require('stream');

class StreamToArray extends Writable {
    constructor() {
        super({ objectMode: true });
        this.array = new Array();
    };

    _write(chunk, enc, callback) {
        try {
            this.array.push(chunk);
            callback();
        } catch (error) {
            callback(error);
        }
    }
};

module.exports = StreamToArray