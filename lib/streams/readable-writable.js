/**
 * ReadableWrapper + WritableWrapper
 */

const { timeStamp } = require("console");
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
        // Corking the stream automatically allows writes to happen
        // but ensures that those are buffered until the handle has
        // been assigned.
        this.cork();
    }

    // Function*
    get readableStreams() {
        return this._readableArg;
    }

    onReadableError(error) {
        this.emit("error", error);
    }

    getReadableStreams() {
        let streams = [];
        const fn = this.readableStreams;
        if (typeof fn == "function") {
            streams = Array.from(fn.call(this));
        }
        else if (fn) {
            streams.push(fn);
        }
        if (!streams.length)
            throw new Error("getReadableStreams doesn't return stream.");

        const input = streams[0];
        if (streams.length === 1) {
            finished(input, err => {
                if (err) {
                    this.onReadableError(err);
                }
            })
            return { input, output: input };
        }

        const output = pipeline(...streams, err => {
            if (err) {
                this.onReadableError(err);
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

    onWritableError(error) {
        this.emit("error", error);
    }

    getWritableStreams() {
        let streams = [];
        const fn = this.writableStreams;
        if (typeof fn == "function") {
            streams = Array.from(fn.call(this));
        }
        else {
            streams.push(fn);
        }
        if (!streams.length)
            throw new Error("getWritableStreams doesn't return stream.");

        const input = streams[0];
        if (streams.length === 1) {
            finished(input, err => {
                if (err) {
                    /**
                     * Si la requête est annulé par le client durant l'écriture, request émet
                     * ERR_STREAM_PREMATURE_CLOSE. La requête est "aborted", je ne peux plus envoyer de reponse.
                     * Je ne propage pas l'erreur.
                     */
                    if (err.code === "ERR_STREAM_PREMATURE_CLOSE") return;
                    this.onWritableError(err);
                }
                else {
                    super.end();
                }
            })
            return { input, output: input };
        }

        const output = pipeline(...streams, err => {
            if (err) {
                /**
                 * Si la requête est annulé par le client durant l'écriture, request émet
                 * ERR_STREAM_PREMATURE_CLOSE. La requête est "aborted", je ne peux plus envoyer de reponse.
                 * Je ne propage pas l'erreur.
                 */
                if (err.code === "ERR_STREAM_PREMATURE_CLOSE") return;
                this.onWritableError(err);
            }
            else {
                super.end();
            }
        });
        return { input, output };
    }

    writableSetup() {
        this.writableHandlersSetup = true; // only set handlers up once

        const drainListener = () => {
            this.emit("drain");
        }

        const { input, output } = this.getWritableStreams();
        this.inputWritableStream = input;
        this.outputWritableStream = output;
        if (!this.inputWritableStream && !this.outputWritableStream) {
            throw new Error("getWritableStreams doesn't return stream.");
        }

        /**
         * Si outputWritableStream est un stream throught.js, ce dernier n'emet
         * pas de finish. Du coup j'écoute close.
         */
        this.inputWritableStream
            .on("drain", drainListener)

        this.uncork();
    }

    // Je surcharge write car je délégue l'écriure à inputWritableStream.
    // inputWritableStream gére lui même le buffer.
    write(chunk) {
        try {
            if (!this.writableHandlersSetup) {
                this.writableSetup();
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
            if (!this.writableHandlersSetup) {
                this.writableSetup();
            }
            return this.inputWritableStream.end();
            /**
             * Je n'appelle pas encore super.end(), 
             * j'attend la fin du workflow d'écriture.
             */
        }
        catch (error) {
            this.emit("error", error);
        }
    }
}

module.exports = ReadableWritable;