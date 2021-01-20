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
const { Writable, Transform, PassThrough, Readable } = require("stream");
const ReadableWrapper = require("../../lib/streams/readable-wrapper");
const WritableWrapper = require("../../lib/streams/writable-wrapper");
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
        await pipeline(
            new ReadableWrapper(stream),
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

    it("readable pipline", async () => {
        const file = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        await pipeline(
            new ReadableWrapper(function* () {
                    yield file;
                    yield new PassThrough();
                }
            ),
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    callback();
                }
            })
        )
    }).timeout(20000);

    it("error in readable pipeline", async () => {
        try {
            await pipeline(
                new ReadableWrapper(function* () {
                    yield Readable.from(async function* () {
                        yield `[{ "line": 1 },`;
                        yield `{ "line": 2 },`;
                        yield `{ "line": 3 }]`;
                    }());
                    yield JSONStream.parse("*");
                    yield new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk.line == 2)
                                callback(new Error("line == 2"))
                            else callback(null, chunk);
                        }
                    });
                    yield new PassThrough({ objectMode: true });
                }, { objectMode: true }),
                new Writable({
                    objectMode: true,
                    write(chunk, encoding, callback) {
                        callback();
                    }
                })
            )
            throw new Error("Unexpected behavior.")
        }
        catch (error) {
            expect(error.message).to.eql("line == 2")
        }

    }).timeout(20000);

    it("readable pipeline with JSONStream (though)", async () => {
        const file = fs.createReadStream(`${__dirname}/../data/npm.array.json`);
        await pipeline(
            new ReadableWrapper(function* () {
                    yield file;
                    yield JSONStream.parse();
                }, { objectMode: true }
            ),
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
