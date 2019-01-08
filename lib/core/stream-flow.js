/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { UndefinedError } = require("oups");
const { Readable, Duplex } = require('stream');
const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');

const EElistenerCount = (emitter, type) => {
    return emitter.listeners(type).length;
};

const needFinish = (state) => {
    return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

/** 
 * new StreamFlow(
 *   stream => {
 *      return stream
 *               .pipe(...)   
 *               .pipe(...)
 *               ...
 *   }
 * )
 * Duplicate https://github.com/nodejs/readable-stream/blob/master/lib/_stream_transform.js
*/
class StreamFlow extends Duplex {

    constructor(...argv) {
        const initFn = argv.shift(); // first argument stream flow (required)
        const options = argv.shift() || {}; // options (optionsl)
        super(options);

        if (!initFn) throw new UndefinedError("stream flow function.");

        this._flowState = {
            init: false,
            initFn: initFn.bind(this),
            input: new InnerReadable({ objectMode: options.objectMode || options.readableObjectMode }),
            output: null,
            needTransform: false,
            pushing: false,
            writecb: null,
            writechunk: null,
            writeencoding: null,
            ended: false,
            uuid: uuidv4()
        };

        this._readableState.needReadable = true;
        this._readableState.sync = false;

        this.on("prefinish", () => {
            if (needFinish(this._flowState.input._readableState)) {
                this._flowState.input.push(null);
            }
        })
    }

    init(chunk, encoding) {
        var ts = this._flowState;
        ts.output = ts.initFn(ts.input, chunk, encoding);
        if (!ts.output) throw new UndefinedError("Output stream is not returned.");

        ts.output
            .on("data", chunk => {
                this.push(chunk);
            })
            .on("end", () => {
                this.push(null);
            });

        ts.init = true;
    }

    _write(chunk, encoding, callback) {
        var ts = this._flowState;
        if (!ts.init) this.init(chunk, encoding);

        ts.writecb = callback;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;

        if (!ts.pushing) {
            var rs = this._readableState;
            if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
    }

    end(data) {
        if (data) this._flowState.input.push(data);
        this._flowState.input.push(null);
        super.end(data);
    }

    _read(n) {
        var ts = this._flowState;
        if (ts.writechunk !== null && !ts.pushing) {
            ts.pushing = true;
            ts.needTransform = false;
            const ret = ts.input.push(ts.writechunk);
            if (ret)
                this.afterTransform();
            else {
                console.log("wait drain", ts.input, ts.uuid);
                ts.input.once("drained", () => {
                    this.afterTransform();
                    console.log("unwait drain", ts.input, ts.uuid);
                    if (this._readableState.flowing == false)
                        this.resume();
                });
            }
        }
        else {
            ts.needTransform = true;
        }
    }

    afterTransform() {
        var ts = this._flowState;
        var cb = ts.writecb;
        ts.pushing = false;
        ts.writechunk = null;
        ts.writecb = null;
        cb();
        var rs = this._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
            this._read(rs.highWaterMark);
        }
    }

    pipeOnDrain(src) {

    }
};

class InnerReadable extends Readable {

    pipe(dest) {
        const ret = super.pipe(dest);
        dest.on("drain", () => {
            this.emit("drained");
        });
        dest.on("resume", () => {
            this.emit("drained");
        });
        return ret;
    }

    _read(n) {
    }

    // pipeOnDrain(src) {
    //     var state = src._readableState;
    //     if (state.awaitDrain) state.awaitDrain--;

    //     if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
    //         state.flowing = true;
    //         this.flow(src);
    //     }
    // }

    // flow(stream) {
    //     var state = stream._readableState;
    //     while (state.flowing && stream.read() !== null) {
    //         ;
    //     }
    // }
}

module.exports = StreamFlow;