/**
 * https://github.com/nodejs/nodejs.org/blob/master/locale/en/docs/guides/backpressuring-in-streams.md
 */

const {
    Transform,
    pipeline,
    PassThrough
} = require("stream");

class TransformWrapper extends Transform {

    constructor(arg0, options) {
        super(options);
        this.options = options;
        this._arg0 = arg0;
    }

    getTransformStreams() {
        const streams = Array.from(this._arg0());
        const input = streams[0];
        const output = streams.length > 1 ?
            pipeline(...streams, err => {
                if (err) {
                    this.emit("error", err);
                }
            }) :
            input;
        return { input, output };
    }

    setup() {
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

        const { input, output } = this.getTransformStreams();
        this.inputStream = input ?? new PassThrough(this.options);
        this.outputStream = output ?? this.inputStream;


        this.outputStream
            .on('data', dataListener)
            .on('end', endListener);

    };

    write(chunk, enc, callback) {
        if (!this.handlersSetup) {
            this.setup();
        }
        this.inputStream.write(chunk, enc, callback);
    }

    
}

module.exports = TransformWrapper;