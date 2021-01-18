const {
    Writable
} = require("stream");

class WritableWrapper extends Writable {

    /**
     * @param {*} writeable writable est du type writable ou duplex si pipe avec un writable
     */
    constructor(writeable, options) {
        super(options);
        this.options = options;
        this._writableStream = writeable;
    }

    get writableStream() {
        return this._writableStream;
    }

    // Je surcharge writeet on _write car je délégue l'écriure à writableStream
    // writableStream géré lui même le buffer.
    write(chunk, enc, callback) {
        this.writableStream.write(chunk, enc, callback);
    }

    // Je demande à writableStream de terminer
    end() {
        this.writableStream.end();
        super.end()
    }

    // _final(callback) {
    //     callback();
    // }
}

module.exports = WritableWrapper;