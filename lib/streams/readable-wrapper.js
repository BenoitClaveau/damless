/**
 * https://github.com/nodejs/nodejs.org/blob/master/locale/en/docs/guides/backpressuring-in-streams.md
 */

const {
    Readable,
    finished,
    pipeline
} = require("stream");

class ReadableWrapper extends Readable {

    constructor(arg0, options) {
        super(options);
        this._arg0 = arg0;
    }

    // Function*
    get readableStreams() {
        return this._arg0;
    }

    getReadableStreams() {
        let streams = [];
        const fn = this.readableStreams;
        if (typeof fn == "function") {
            streams = Array.from(fn.call(this));
        }
        else {
            streams.push(fn);
        }
        if (!streams.length)
            throw new Error("getReadableStreams doesn't return stream.");

        const input = streams[0];
        if (streams.length === 1) {
            finished(input, err => {
                if (err) {
                    // Je propage l'erreur pour ne pas bloquer this
                    this.emit("error", err);
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
        });
        return { input, output };
    }

    /**
     * retourne le prochain chunk.
     * peut être surchargé si readableStream n'est pas standard.
     */
    getNextChunk(n) {
        /**
         * HACK through.js read n'existe pas
         * through.js emit data
         */
        if (!this.outputReadableStream.read) return null;
        return this.outputReadableStream.read(n);
    }

    flow(n) {
        try {
            let chunk;
            while (null !== (chunk = this.getNextChunk(n))) {
                // if push returns false, stop writing
                if (!this.push(chunk)) break;
            }
        }
        catch (error) {
            this.emit("error", error);
        }
    };

    setup(n) {
        this.handlersSetup = true; // only set handlers up once
        // je ne peux pas uiliser pipe car this est un stream readable (pas de write)
        const dataListener = (chunk) => {
            this.push(chunk);
        }
        const endListener = () => {
            this.push(null);
        }
        const readableListener = () => {
            this.flow(n);
        }

        const { input, output } = this.getReadableStreams();
        this.inputReadableStream = input;
        this.outputReadableStream = output;
        if (!this.inputReadableStream && !this.outputReadableStream) {
            throw new Error("getReadableStreams doesn't return stream.");
        }

        this.outputReadableStream
            .once('readable', () => {
                /**
                 * L'évenement readable est toujours envoyé avant data
                 * s'il est envoyé pas besoin d'écouter data.
                 * pour les stream ancien ex: througt.js readable n'est pas envoyé
                 * dans ce cas je vais écouter data.
                 */
                this.outputReadableStream.off("data", dataListener);
            })
            .on('readable', readableListener)
            .on('data', dataListener)
            .on('end', endListener)
    };

    _read(n) {
        try {
            // first time, setup handlers then read
            if (!this.handlersSetup) {
                return this.setup(n);
            }
            // otherwise just read
            this.flow(n);
        }
        catch (error) {
            this.emit("error", error);
        }
    };
}

module.exports = ReadableWrapper;