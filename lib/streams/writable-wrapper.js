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
            this.outputWritableStream.off('close', finishListener);
            this.outputWritableStream.off('finish', finishListener);

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

        // le flux d'écriture se termine sur un finish
        this.outputWritableStream.once('finish', finishListener);
        /**
         * Si outputWritableStream est un stream throught.js, ce dernier n'emet
         * pas de finish. Du coup j'écoute close.
         */
        this.outputWritableStream.once('close', finishListener);
    }

    // Je surcharge write car je délégue l'écriure à inputWritableStream.
    // inputWritableStream gére lui même le buffer.
    write(chunk) {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            this.inputWritableStream.write(chunk);
        }
        catch (error) {
            this.emit("error", error);
        }
    }

    // Je demande à inputWritableStream de terminer
    end() {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            this.inputWritableStream.end();
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