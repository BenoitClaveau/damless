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
const { Writable, Readable, Transform } = require("stream");
const ReadableWritable = require("../../lib/streams/readable-writable");
const ReadableWrapper = require("../../lib/streams/readable-wrapper");
const WritableWrapper = require("../../lib/streams/writable-wrapper");
const JSONStream = require("JSONStream");
const pipeline = promisify(stream.pipeline);

describe("readable-writable", () => {

    xit("wrap standard readable stream and read with standard writable", async () => {
        const filename = `${__dirname}/../data/output/5.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        const writable = fs.createWriteStream(filename);
        const stream = new ReadableWritable(readable, writable);

        await pipeline(
            stream,
            stream
        );
    });

    xit("wrap standard readable stream and read with JSONStream (though)", async () => {
        const filename = `${__dirname}/../data/output/5.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const writable = fs.createWriteStream(filename);

        const stream = new ReadableWritable(readable, writable);

        await pipeline(
            stream,
            JSONStream.parse("*"), // thought: non standard
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    console.log(chunk);
                    callback(null, chunk);
                }
            }),
            JSONStream.stringify(), // thought: non standard
            stream                
        );

    }).timeout(20000);

    xit("wrap readable JSONStream (though)", async () => {
        const filename = `${__dirname}/../data/output/7.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const writable = fs.createWriteStream(filename);

        const input = new ReadableWrapper(
            readable.pipe(JSONStream.parse("*")),
            { objectMode: true }
        )

        const stream = new ReadableWritable(input, writable);

        await pipeline(
            stream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    console.log(chunk);
                    callback(null, chunk);
                }
            }),
            JSONStream.stringify(),
            stream
        );

    }).timeout(20000);

    it("wrap readable and writable JSONStream (though)", async () => {
        const filename = `${__dirname}/../data/output/8.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const writable = fs.createWriteStream(filename);

        const input = new ReadableWrapper(
            readable.pipe(JSONStream.parse("*")),
            { objectMode: true }
        )

        const stringify = JSONStream.stringify();
        stringify.pipe(writable);

        const output = new WritableWrapper(stringify);

        const stream = new ReadableWritable(input, output);

        await pipeline(
            stream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    console.log(chunk);
                    callback(null, chunk);
                }
            }),
            stream
        );

    }).timeout(20000);


});
