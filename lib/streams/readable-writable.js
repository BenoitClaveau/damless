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
            finished(input, err => {
                if (err) {
                    // Je propage l'erreur pour ne pas bloquer this
                    this.emit("error", err);
                }
                else {
                    this.emit("read");
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
                this.emit("read");
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

    readableSetup(n) {
        this.readableHandlersSetup = true; // only set handlers up once
        // je ne peux pas uiliser pipe car this est un stream readable (pas de write)
        const dataListener = (chunk) => {
            this.push(chunk);
        }
        const endListener = () => {
            /**
             * push(null) va émettre un évenement end sur this.
             * je n'appele pas super.end() car le flux d'écriture est ouvert et
             * je ne veux pas fermer le wrapper.
             */
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
                this.eventReadableEmitted = true;
                this.outputReadableStream.off("data", dataListener);
            })
            .on('readable', readableListener)
            .on('data', dataListener)
            .once('end', endListener);

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

    writableSetup() {
        this.writableHandlersSetup = true; // only set handlers up once

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
            if (!this.writableHandlersSetup) {
                this.writableSetup();
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
            if (!this.writableHandlersSetup) {
                this.writableSetup();
            }
            this.inputWritableStream.end();
            /**
             * Je n'appelle pas encore super.end(), j'attend la fin du workflow d'écriture (finish)
             */
        }
        catch (error) {
            this.emit("error", error);
        }
    }
}

module.exports = ReadableWritable;