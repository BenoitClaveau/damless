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
const { Transform } = require("stream");
const ReadableWritable = require("../../lib/streams/readable-writable");
const JSONStream = require("JSONStream");
const pipeline = promisify(stream.pipeline);

describe("readable-writable", () => {

    it("simple readable-writable", async () => {
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

        expect(fs.existsSync(filename)).to.eql(true);
    });

    it("readable-writable with JSONStream pipeline (thought)", async () => {
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
                    callback(null, chunk);
                }
            }),
            JSONStream.stringify(), // thought: non standard
            stream                
        );

        expect(fs.existsSync(filename)).to.eql(true);

    }).timeout(20000);

    it("nested readable", async () => {
        const filename = `${__dirname}/../data/output/7.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const writable = fs.createWriteStream(filename);

        const stream = new ReadableWritable(function* () {
            yield readable;
            yield JSONStream.parse("*");
        }, writable);

        await pipeline(
            stream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            }),
            JSONStream.stringify(),
            stream
        );

        expect(fs.existsSync(filename)).to.eql(true);

    }).timeout(20000);


    it("nested readable & writable", async () => {
        const filename = `${__dirname}/../data/output/7.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const writable = fs.createWriteStream(filename);

        const stream = new ReadableWritable(function* () {
            yield readable;
            yield JSONStream.parse("*");
        }, function* () {
            yield JSONStream.stringify();
            yield writable
        }, { objectMode: true});

        await pipeline(
            stream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            }),
            stream
        )

        expect(fs.existsSync(filename)).to.eql(true);

    }).timeout(20000);

});
