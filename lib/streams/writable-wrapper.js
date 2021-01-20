const {
    Writable,
    pipeline,
    finished
} = require("stream");

class WritableWrapper extends Writable {

    /**
     * @param {*} writeable writable est du type writable ou duplex si pipe avec un writable
     */
    constructor(arg0, options) {
        super(options);
        this._arg0 = arg0;
    }

    // Function*
    get writableStreams() {
        return this._arg0;
    }

    getWritableStream() {
        if (typeof this.writableStreams == "function") {
            const streams = Array.from(this.writableStreams());
            const input = streams[0];
            if (streams.length > 1) {
                pipeline(...streams, err => {
                    if (err) {
                        this.emit("error", err);
                    }
                })
            };
            return input;
        }
        return this.writableStreams;
    }


    setup() {
        this.handlersSetup = true; // only set handlers up once

        this.writableStream = this.getWritableStream();
        if (!this.writableStream) {
            this.emit("error", new Error("Lazy writableStream is not defined."));
            return;
        }

        finished(this.writableStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });
    }

    // Je surcharge writeet on _write car je délégue l'écriure à writableStream
    // writableStream géré lui même le buffer.
    write(chunk, enc, callback) {
        if (!this.handlersSetup) {
            this.setup();
        }
        this.writableStream.write(chunk, enc, callback);
    }

    // Je demande à writableStream de terminer
    end(chunk, enc, callback) {
        if (!this.handlersSetup) {
            this.setup();
        }
        this.writableStream.end(chunk, enc, callback);
        super.end();
    }
}

module.exports = WritableWrapper;