/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Readable } = require('stream');

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

module.exports = ArrayToStream