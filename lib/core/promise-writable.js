/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Readable, Writable } = require('stream');

class ArrayToStream extends Readable {
    constructor(data) {
        super({ objectMode : true });
        this.data = data;
    };

    set data(data) {
        this.items = data;
    }

    _read(size) {
        const item = this.items.pop();
        this.push(item ? item : null);
    }
};

toStream = (data) => {
    return new ArrayToStream(data);
}

module.exports.toStream = toStream;