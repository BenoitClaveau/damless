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
 * 
*/

class StreamFlow extends Duplex {

    constructor(...argv) {
        const initFn = argv.pop(); //last argument (required)
        //const options = argv.shift() || { readableObjectMode: true }; //first argument (optionsl)
        super({ objectMode: true });

        this._transformState = {
            init: false,
            initFn: initFn.bind(this),
            input: new Readable({
                objectMode: true,
                highWaterMark: 1,
                read() {}
            }),
            output: null,
            transforming: false,
            writecb: null,
            writechunk: null,
            writeencoding: null,
        };

        this.on('prefinish', () => {
            this._transformState.input.push(null);
        });
    }

	init() {
        var ts = this._transformState;
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
        var ts = this._transformState;
        ts.writecb = callback;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;

        if (!ts.transforming) {
            var rs = this._readableState;
            if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }

    }

    _read(n) {
        var ts = this._transformState;
        if (!ts.init) this.init();
        if (ts.writechunk !== null && !ts.transforming) {
            ts.transforming = true;
            const ret = ts.input.push(ts.writechunk);
            if (ret)
                this.afterTransform();
            else {
                ts.output.once("drain", () => {
                    this.afterTransform();
                })
            }
        }
    }

    afterTransform() {
        var ts = this._transformState;
        var cb = ts.writecb;
        ts.transforming = false;
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

module.exports = StreamFlow;