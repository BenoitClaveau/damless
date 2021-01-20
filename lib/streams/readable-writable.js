const { 
    Duplex, 
    pipeline,
    finished 
} = require("stream");

/**
 * ReadableWrapper + WritableWrapper
 */
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

    readableSetup(n) {
        this.readableHandlersSetup = true; // only set handlers up once
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
        if (!this.readableHandlersSetup) {
            return this.readableSetup(n); // return IMPORTANT sinon bug avec thought
        }
        // otherwise just read
        this.flow(n);
    };

    // Function*
    get writableStreams() {
        return this._writeableArg;
    }

    getWritableStream() {
        if (typeof this.writableStreams == "function") {
            const streams = Array.from(this.writableStreams());
            const input = streams[0];
            if (streams.length > 1) {
                pipeline(...streams, err => {
                    if (err) {
                        this.emit("error", err);
                    }
                })
            };
            return input;
        }
        return this.writableStreams;
    }

    writableSetup() {
        this.writableHandlersSetup = true; // only set handlers up once

        this.writableStream = this.getWritableStream();
        if (!this.writableStream) {
            this.emit("error", new Error("Lazy writableStream is not defined."));
            return;
        }

        finished(this.writableStream, err => {
            if (err) {
                // Je propage l'erreur pour ne pas bloquer this
                this.emit("error", err);
            }
        });
    }

    // Je surcharge writeet on _write car je délégue l'écriure à writableStream
    // writableStream géré lui même le buffer.
    write(chunk, enc, callback) {
        if (!this.writableHandlersSetup) {
            this.writableSetup();
        }
        this.writableStream.write(chunk, enc, callback);
    }

    // Je demande à writableStream de terminer
    end() {
        if (!this.writableHandlersSetup) {
            this.writableSetup();
        }
        this.writableStream.end();
        super.end();
    }
}

module.exports = ReadableWritable;