/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Writable } = require('stream');

class StreamToArray extends Writable {
    constructor() {
        super({ objectMode: true });
        this._array = new Array();
    };

    get array() {
        return this._array;
    }

    _write(chunk, enc, callback) {
        this._array.push(chunk);
        callback();
    }
};

module.exports = StreamToArray;
