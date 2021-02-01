const {
    Writable,
    finished,
    pipeline
} = require("stream");

class WritableWrapper extends Writable {

    constructor(arg0, options) {
        super(options);
        this._arg0 = arg0;
        // Corking the stream automatically allows writes to happen
        // but ensures that those are buffered until the handle has
        // been assigned.
        this.cork();
    }

    // Function*
    get writableStreams() {
        return this._arg0;
    }

    getWritableStreams() {
        let streams = [];
        const fn = this.writableStreams;
        if (typeof fn == "function") {
            streams = Array.from(fn.call(this));
        }
        else if (fn) {
            streams.push(fn);
        }
        if (!streams.length)
           	throw new Error("getWritableStreams doesn't return stream.");

        const input = streams[0];
        if (streams.length === 1) {
            finished(input, err => {
                if (err) {
                    // Je propage l'erreur pour ne pas bloquer this
                    this.emit("error", err);
                }
                else {
                    super.end();
                }
            })
            return { input, output: input };
        }
        /**
         * je ne propage pas l'erreur car géré 
         * finised (dans setup)
         * */
        const output = pipeline(...streams, err => { 
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
            else {
                super.end();
            }
        });
        return { input, output };
    }

    setup() {
        this.handlersSetup = true; // only set handlers up once

        const drainListener = () => {
            this.emit("drain");
        }

        const { input, output } = this.getWritableStreams();
        this.inputWritableStream = input;
        this.outputWritableStream = output;
        if (!this.inputWritableStream && !this.outputWritableStream) {
            throw new Error("getWritableStreams doesn't return stream.");
        }

        this.inputWritableStream
            .on("drain", drainListener)

        this.uncork();
    }

    // Je surcharge write car je délégue l'écriure à inputWritableStream.
    // inputWritableStream gére lui même le buffer.
    write(chunk) {
        try {
            if (!this.handlersSetup) {
                this.setup();
            }
            return this.inputWritableStream.write(chunk);
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
            return this.inputWritableStream.end();
            /**
             * Je n'appelle pas encore super.end(), 
             * j'attend la fin du workflow d'écriure.
             */
        }
        catch (error) {
            this.emit("error", error);
        }
    }
}

module.exports = WritableWrapper;