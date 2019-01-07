/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { UndefinedError } = require("oups");
const { Readable, Duplex } = require('stream');

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
        const initFn = argv.pop(); //last argument (required)
        const options = argv.shift() || { objectMode: true }; //first argument (optionsl)
        super(options);

        this._flowState = {
            init: false,
            initFn: initFn.bind(this),
            input: new InnerReadable(options),
            output: null,
            needTransform: false,
            pushing: false,
            writecb: null,
            writechunk: null,
            writeencoding: null,
        };

        this._readableState.needReadable = true;
        this._readableState.sync = false;

        this.on('prefinish', () => {
            this._flowState.input.push(null);
        });
    }

	init() {
        var ts = this._flowState;
        ts.output = ts.initFn(ts.input);
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
        ts.writecb = callback;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;

        if (!ts.pushing) {
            var rs = this._readableState;
            if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
    }

    _read(n) {
        var ts = this._flowState;
        if (!ts.init) this.init();
        if (ts.writechunk !== null && !ts.pushing) {
            ts.pushing = true;
            ts.needTransform = false;
            const ret = ts.input.push(ts.writechunk);
            if (ret)
                this.afterTransform();
            else {
                ts.input.once("drained", () => {
                    this.afterTransform();
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
};

class InnerReadable extends Readable {
    
    pipe(src) {
        const ret = super.pipe(src);
        src.on("drain", () => {
            this.resume();
            this.emit("drained");
        });
        return ret;
    }

    _read(n) {
    }
}

module.exports = StreamFlow;