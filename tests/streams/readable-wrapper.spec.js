/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const fs = require("fs");
const { promisify } = require("util");
const stream = require("stream");
const { Writable } = require("stream");
const ReadableWrapper = require("../../lib/streams/readable-wrapper");
const JSONStream = require("JSONStream");
const pipeline = promisify(stream.pipeline);

describe("readable-wrapper", () => {

    it("wrap standard readable stream and read with standard writable", async () => {
        const stream = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        const readable = new ReadableWrapper(stream);
        await new Promise((resolve) => {    
            readable.pipe(
                new Writable({
                    write(chunk, encoding, callback) {
                        // console.log(chunk.toString());
                        callback();
                    }
                }).on("finish", resolve)
            )
        })
    }).timeout(20000);

    it("wrap standard readable stream and read with JSONStream (though)", async () => {
        const stream = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        const readable = new ReadableWrapper(stream);
        await pipeline(
            readable,
            JSONStream.parse(),
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    expect(chunk.length).eql(4028);
                    callback();
                }
            })
        );
    }).timeout(20000);

    it("wrap JSONStream (though) and read with standard writable", async () => {
        const stream = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        const readable = new ReadableWrapper(
            stream.pipe(JSONStream.parse()),
            { objectMode: true }
        );
        await pipeline(
            readable,
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    expect(chunk.length).eql(4028);
                    callback();
                }
            })
        );
    }).timeout(20000);
});
