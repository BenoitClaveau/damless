const {
    Writable,
    finished,
    pipeline
} = require("stream");

class WritableWrapper extends Writable {

    constructor(arg0, options) {
        super(options);
        this._arg0 = arg0;
    }

    // Function*
    get writableStreams() {
        return this._arg0;
    }

    getWritableStreams() {
        let streams = [];
        if (typeof this.writableStreams == "function") {
            streams = Array.from(this.writableStreams());
        }
        else {
            streams.push(this.writableStreams);
        }
        if (!streams.length)
           throw new Error("getWritableStreams doesn't return stream.");

        const input = streams[0];
        if (streams.length === 1) {
            return { input, output: input };
        }
        /**
         * je ne propage pas l'erreur car géré 
         * finised (dans setup)
         * */
        const output = pipeline(...streams, err => { });
        return { input, output };
    }

    setup() {
        this.handlersSetup = true; // only set handlers up once

        const finishListener = () => {
            // le flux d'écriture est terminé, je peux termier le wrapper.
            super.end();
        };

        const { input, output } = this.getWritableStreams();
        this.inputWritableStream = input;
        this.outputWritableStream = output;
        if (!this.inputWritableStream && !this.outputWritableStream) {
            throw new Error("getWritableStreams doesn't return stream.");
        }

        finished(this.outputWritableStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });

        this.outputWritableStream.on('finish', finishListener);
    }

    // Je surcharge write car je délégue l'écriure à inputWritableStream.
    // inputWritableStream gére lui même le buffer.
    write(chunk, enc, callback) {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            this.inputWritableStream.write(chunk, enc, callback);
        }
        catch (error) {
            this.emit("error", error);
        }
    }

    // Je demande à inputWritableStream de terminer
    end(chunk, enc, callback) {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            this.inputWritableStream.end(chunk, enc, callback);
            /**
             * Je n'appelle pas encore super.end(), j'attend la fin du workflow d'écriure (finish)
             */
        }
        catch (error) {
            this.emit("error", error);
        }
    }
}

module.exports = WritableWrapper;