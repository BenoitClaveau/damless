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
            read() { }
        });

        const stream = attachFn(this.inner);
        if (!stream) throw new UndefinedError("Stream is not returned.");

        stream
            .on("drain", () => {
                this.emit("drain");
            })
            .on("data", chunk => {
                this.push(chunk);
            })
            .on("end", () => {
                this.push(null);
                const { awaitDrain } = this._readableState;
                if (awaitDrain) {
                    this.resume();
                }
            })
            .on("error", error => {
                this.emit("error", error);
            })
    }

    // see wrap function in stream-readable
    write(chunk, encoding, callback) {
        const state = this._readableState;
        if (state.decoder) chunk = state.decoder.write(chunk);

        if (state.objectMode && (chunk === null || chunk === undefined)) return;
        else if (!state.objectMode && (!chunk || !chunk.length)) return;

        return this.inner.push(chunk);
    }

    end() {
        const state = this._readableState;
        if (state.decoder && !state.ended) {
            var chunk = state.decoder.end();
            if (chunk && chunk.length) this.inner.push(chunk);
        }

        this.inner.push(null);
    }
};

module.exports = StreamFlow;