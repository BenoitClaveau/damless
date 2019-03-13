/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Readable } = require('stream');

class ArrayToStream extends Readable {
    constructor(data) {
        super({ objectMode: true });
        this.data = data;
    };

    set data(data) {
        this.items = data;
    }

    _read() {
        try {
            const item = this.items.shift();
            this.push(item ? item : null);
        } catch (error) {
            this.emit("error", error);
        }
    }
};

module.exports = ArrayToStream