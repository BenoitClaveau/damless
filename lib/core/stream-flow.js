/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { UndefinedError } = require("oups");
const { Readable, PassThrough } = require('stream');

/** 
 * new StreamFlow(
 *   stream => {
 *      return stream
 *               .pipe(...)   
 *               .pipe(...)
 *               ...
 *   }
 * )
 * 
*/

class StreamFlow extends PassThrough {

    constructor(...argv) {
        const attachFn = argv.pop(); //last argument (required)
        const options = argv.shift() || { readableObjectMode: true }; //first argument (optionsl)
        super(options);

        this.inner = new Readable({
            objectMode: options.objectMode || options.readableObjectMode,
            read() {
            }
        })

        const stream = attachFn(this.inner);
        if (!stream) throw new UndefinedError("Stream is not returned.");
        stream
            .on("data", chunk => {
                this.push(chunk);
            })
            .on("end", () => {
                this.push(null);
            })
            .on("error", error => {
                this.emit("error", error);
            })
    }

    _read(n) {
        if (this.backpressuring) {
            this.backpressuring = false;
            while (this.inner.read() !== null) // je traite toutes le données dans le buffer.
            this.emit("drain");
        }
        else 
            super._read(n);
    }

    // function flow(stream) {
    //     const state = stream._readableState;
    //     debug('flow', state.flowing);
    //     while (state.flowing && stream.read() !== null);
    //   }

    // see wrap function in stream-readable
    write(chunk, encoding, callback) {
        this.backpressuring = !this.inner.push(chunk);
        return !this.backpressuring
    }

    end() {
        this.inner.push(null);
    }
};

module.exports = StreamFlow;