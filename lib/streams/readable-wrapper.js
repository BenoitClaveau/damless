/**
 * https://github.com/nodejs/nodejs.org/blob/master/locale/en/docs/guides/backpressuring-in-streams.md
 */

const {
    Readable
} = require("stream");

class ReadableWrapper extends Readable {

    constructor(readable, options) {
        super(options);
        this._readableStream = readable;
    }

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
}

module.exports = ReadableWrapper;