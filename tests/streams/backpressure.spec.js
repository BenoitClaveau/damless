const expect = require("expect.js");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const {
    inspect,
    promisify
} = require('util');
const {
    Readable,
    Transform,
    Duplex,
    Writable,
    PassThrough,
    pipeline: pipelineSync
} = require('stream');

const pipeline = promisify(pipelineSync);

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});


const delay = (action) => {
    setTimeout(() => {
        if (action())
            delay(action)
    }, 10)
}

describe("Understand stream back pressure", () => {


    it("readable -> writable", async () => {
        let cpt = 0;
        const readable = new Readable({
            objectMode: true,
            highWaterMark: 3,
            read() {
                if (cpt > 10) this.push(null);
                else {
                    console.log("push", ++cpt)
                    this.push(cpt);
                }
                const { buffer, length, flowing, awaitDrain } = this._readableState;

                // console.log("state", { buffer, buffer_length: buffer.length, length, flowing, awaitDrain });
            }
        });

        const flow = new Flow();
        flow.on("data", data => {
            console.log("flow:", data);
        })

        await pipeline(
            readable,
            flow
        )
    }).timeout(60000);

});

class Flow extends Duplex {
    constructor() {
        super({
            objectMode: true
        });

        this.inner = new Readable({
            objectMode: true,
            highWaterMark: 1,
            read() { }
        });

        this.output = new PassThrough({
            objectMode: true
        });

        this.inner
            .pipe(this.output)
            .on("data", data => {
                this.push(data);
            })
            .on("end", () => {
                this.push(null);
            })

        this._transformState = {
            transforming: false,
            writecb: null,
            writechunk: null,
            writeencoding: null,
        };
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
        if (ts.writechunk !== null && !ts.transforming) {
            ts.transforming = true;
            const ret = this.inner.push(ts.writechunk);
            if (ret)
                this.afterTransform();
            else {
                this.output.once("drain", () => {
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
}
