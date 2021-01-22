/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const fs = require("fs");
const { promisify } = require("util");
const stream = require("stream");
const { Transform, Readable, Writable, PassThrough } = require("stream");
const Workflow = require("../../lib/streams/workflow");
const ReadableWrapper = require("../../lib/streams/readable-wrapper");
const JSONStream = require("JSONStream");
const pipeline = promisify(stream.pipeline);

describe("workflow", () => {

    it("workflow with standard stream", async () => {

        let buffer = Buffer.from("");
        await pipeline(
            Readable.from(async function* () {
                yield `[{ "line": 1 },`;
                yield `{ "line": 2 },`;
                yield `{ "line": 3 }]`;
            }()),
            new Workflow(function* () {
                yield new Transform({
                    objectMode: true,
                    transform(chunk, encoding, callback) {
                        chunk = chunk.toUpperCase();
                        callback(null, chunk);
                    }
                });
            }, { writableObjectMode: true }),
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    buffer = Buffer.concat([buffer, chunk]);
                    callback();
                }
            })
        );
        expect(buffer.toString()).to.eql('[{ "LINE": 1 },{ "LINE": 2 },{ "LINE": 3 }]');

    }).timeout(20000);

    it("workflow parse json", async () => {
        let buffer = Buffer.from("");
        await pipeline(
            Readable.from(async function* () {
                yield `[{ "line": 1 },`;
                yield `{ "line": 2 },`;
                yield `{ "line": 3 }]`;
            }()),
            new Workflow(function* () {
                yield JSONStream.parse("*")     // utilise through.js non standard stream
            }, { readableObjectMode: true }),   // important quand workflow sera lu il émettra des objets.
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    buffer = Buffer.concat([buffer, Buffer.from(`buf:${chunk.line}, `)]);
                    callback();
                }
            })
        );
        expect(buffer.toString()).to.eql('buf:1, buf:2, buf:3, ');
    }).timeout(20000);

    it("empty workflow", async () => {
        let buffer = Buffer.from("");
        await pipeline(
            Readable.from(async function* () {
                yield `[{ "line": 1 },`;
                yield `{ "line": 2 },`;
                yield `{ "line": 3 }]`;
            }()),
            new Workflow(function* () {
            }, { readableObjectMode: true }),   // important quand workflow sera lu il émettra des objets.
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    buffer = Buffer.concat([buffer, chunk]);
                    callback();
                }
            })
        );
        expect(buffer.toString()).to.eql('[{ "line": 1 },{ "line": 2 },{ "line": 3 }]');
    }).timeout(20000);

    it("workflow parse and transform json ", async () => {
        let buffer = Buffer.from("");
        await pipeline(
            Readable.from(async function* () {
                yield `[{ "line": 1 },`;
                yield `{ "line": 2 },`;
                yield `{ "line": 3 }]`;
            }()),
            new Workflow(function* () {
                yield JSONStream.parse("*")     // utilise through.js non standard stream
                yield new Transform({
                    objectMode: true,
                    transform(chunk, encoding, callback) {
                        chunk.line += 10;
                        callback(null, chunk);
                    }
                });
            }, { readableObjectMode: true }),   // important quand workflow sera lu il émettra des objets.
            JSONStream.stringify(),
            new Writable({
                write(chunk, encoding, callback) {
                    buffer = Buffer.concat([buffer, chunk]);
                    callback();
                }
            })
        );
        expect(buffer.toString()).to.eql('[\n{"line":11}\n,\n{"line":12}\n,\n{"line":13}\n]\n');
    }).timeout(20000);

    it("neasted wrapper with error", async () => {
        try {
            await pipeline(
                new ReadableWrapper(function* () {
                    yield Readable.from(async function* () {
                        yield `[{ "line": 1 },`;
                        yield `{ "line": 2 },`;
                        yield `{ "line": 3 }]`;
                    }());
                    yield new Workflow(function* () {
                        yield JSONStream.parse("*");
                        yield new Transform({
                            objectMode: true,
                            transform(chunk, encoding, callback) {
                                if (chunk.line == 2) return callback(new Error("line == 2"))
                                callback(null, chunk);
                            }
                        });
                        yield new PassThrough({ objectMode: true });
                    }, { objectMode: true })
                }, { objectMode: true }),
                new Writable({
                    objectMode: true,
                    write(chunk, encoding, callback) {
                        expect(chunk.line).eql(1);
                        callback();
                    }
                })
            )
            throw new Error("Unexpected behavior.")
        } 
        catch(error) {
            expect(error.message).to.eql("line == 2")
        }
    }).timeout(20000);

});
