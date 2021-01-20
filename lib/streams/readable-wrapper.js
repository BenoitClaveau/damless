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

    getReadableStream() {
        if (typeof this.readableStreams == "function") {
            const streams = Array.from(this.readableStreams());
            return pipeline(...streams, err => {
                if (err) {
                    this.emit("error", err);
                }
            });
        }
        return this.readableStreams;
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

        this.readableStream = this.getReadableStream();
        if (!this.readableStream) {
            this.emit("error", new Error("Lazy readableStream is not defined."));
            return;
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

        finished(this.readableStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });
    };

    _read(n) {
        // first time, setup handlers then read
        if (!this.handlersSetup) {
            return this.setup(n); // return IMPORTANT sinon bug avec thought
        }
        // otherwise just read
        this.flow(n);
    };
}

module.exports = ReadableWrapper;