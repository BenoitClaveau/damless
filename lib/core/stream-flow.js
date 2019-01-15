/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { UndefinedError } = require("oups");
const { Readable, Duplex, pipeline } = require('stream');
const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');
const eos = require('end-of-stream');

const EElistenerCount = (emitter, type) => {
    return emitter.listeners(type).length;
};

const needFinish = (state) => {
    return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

/** 
 * new StreamFlow({
 *   init(stream) {
 *      return pipelineAsync(
 *          stream,
 *          ...
 *      );
 *   }
 * )
 * Duplicate https://github.com/nodejs/readable-stream/blob/master/lib/_stream_transform.js
*/
class StreamFlow extends Duplex {

    constructor(options = {}) {
        super(options);

        if (!options.init) throw new UndefinedError("init flow function.");

        this._flowState = {
            init: false,
            initFn: options.init.bind(this),
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
            .on("data", data => {
                this.push(data);
            })
            .on("end", () => {
                this.push(null);
            });

        eos(ts.output, error => {
            if (error) this.emit("error", error);
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

    end() {
        this._flowState.input.push(null);
    }

    _read(n) {
        var ts = this._flowState;
        if (ts.writechunk !== null && !ts.pushing) {
            ts.pushing = true;
            ts.needTransform = false;
            const ret = ts.input.push(ts.writechunk);
            if (ret)
                this.afterPushed();
            else {
                ts.input.once("drained", () => {
                    this.afterPushed(); // will close the callback
                    this.emit("drain");
                });
            }
        }
        else {
            ts.needTransform = true;
        }
    }

    afterPushed() {
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
};

class InnerReadable extends Readable {

    pipe(dest) {
        const ret = super.pipe(dest);
        dest
            .on("drain", () => {
                this.emit("drained");
            })
            .on("resume", () => {
                this.emit("drained");
            })
        return ret;
    }

    _read(n) {
    }
}

module.exports = StreamFlow;