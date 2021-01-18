const { Duplex } = require("stream");

/**
 * ReadableWrapper + WritableWrapper
 */
class ReadableWritable extends Duplex {

    constructor(readable, writeable, options) {
        super(options);
        this._readableStream = readable;
        this._writableStream = writeable;
    }

    // Readable

    get readableStream() {
        return this._readableStream;
    }

    // retourne le prochain chunk.
    // peut être surchargé si readableStream n'est pas standard.
    getNextChunk(n) {
        return this.readableStream.read(n);
    }

    flow(n) {
        let chunk;
        while (null !== (chunk = this.getNextChunk(n))) {
            // if push returns false, stop writing
            if (!this.push(chunk)) break;
        }
    };

    setup(n) {
        this.handlersSetup = true; // only set handlers up once
        // je ne peux pas uiliser pipe car this est un stream readable (pas de write)
        const dataListener = (chunk) => {
            // je ne fais pas de push sinon read va êtrede nouveau appelé or readableStream
            // n'est pas standard. Donc readableStream.read n'existe peut-etre pas.
            // en faisant un emit("data") je ne bloque pas.
            this.emit("data", chunk);
        }
        const endListener = () => {
            this.push(null);
        }
        const readableListener = () => {
            this.flow(n);
        }

        this.readableStream
            .once('readable', () => {
                // L'évenement readable est toujours envoyé avant data
                // s'il est envoyé pas besoin d'écouter data.
                // pour les sream ancie ex: thougt readable n'est pas envoyé
                // dans ce cas on écoute data.
                this.eventReadableEmitted = true;
                this.readableStream.off("data", dataListener);
            })
            .on('readable', readableListener)
            .on('data', dataListener)
            .on('end', endListener);
    };

    _read(n) {
        // first time, setup handlers then read
        if (!this.handlersSetup) {
            return this.setup(n);
        }
        // otherwise just read
        this.flow(n);
    };

    // Writable

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
}

module.exports = ReadableWritable;