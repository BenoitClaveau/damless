/**
 * ReadableWrapper + WritableWrapper
 */

const { stream } = require("file-type");
const {
    Duplex,
    finished,
    pipeline,
    PassThrough
} = require("stream");

class ReadableWritable extends Duplex {

    constructor(readableArg, writeableArg, options) {
        super(options);
        this._readableArg = readableArg;
        this._writeableArg = writeableArg;
    }

    // Function*
    get readableStreams() {
        return this._readableArg;
    }

    getReadableStreams() {
        let streams = [];
        if (typeof this.readableStreams == "function") {
            streams = Array.from(this.readableStreams());
        }
        else {
            streams.push(this.readableStreams);
        }
        if (!streams.length)
            throw new Error("getReadableStreams doesn't return stream.");

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

    readableSetup(n) {
        this.readableHandlersSetup = true; // only set handlers up once
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

        finished(this.outputReadableStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
            else {
                this.emit("read");
            }
        });

        this.outputReadableStream
            .once('readable', () => {
                /**
                 * L'évenement readable est toujours envoyé avant data
                 * s'il est envoyé pas besoin d'écouter data.
                 * pour les stream ancien ex: througt.js readable n'est pas envoyé
                 * dans ce cas je vais écouter data.
                 */
                this.eventReadableEmitted = true;
                this.outputReadableStream.off("data", dataListener);
            })
            .on('readable', readableListener)
            .on('data', dataListener)
            .on('end', endListener)

    };

    _read(n) {
        try {
            // first time, setup handlers then read
            if (!this.readableHandlersSetup) {
                return this.readableSetup(n);
            }
            // otherwise just read
            this.flow(n);
        }
        catch (error) {
            this.emit("error", error);
        }
    };

    // Function*
    get writableStreams() {
        return this._writeableArg;
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

    writableSetup() {
        this.writableHandlersSetup = true; // only set handlers up once

        const finishListener = () => {
            // le flux d'écriture est terminé, je peux cloturer le wrapper.
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
    }

    // Je surcharge write car je délégue l'écriure à inputWritableStream.
    // inputWritableStream gére lui même le buffer.
    write(chunk, enc, callback) {
        try {
            if (!this.writableHandlersSetup) {
                this.writableSetup();
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
            if (!this.writableHandlersSetup) {
                this.writableSetup();
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

module.exports = ReadableWritable;