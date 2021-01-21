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

    it("workflow", async () => {

        let contentType;
        await pipeline(
            Readable.from(async function* () {
                yield `[{ "line": 1 },`;
                yield `{ "line": 2 },`;
                yield `{ "line": 3 }]`;
            }()),
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    contentType = contentType ?? "gif"
                    callback(null, chunk);
                }
            }),
            new Workflow(function* () {
                if (contentType == "json")
                    yield JSONStream.parse("*")
            }, { writableObjectMode: true }),
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            }),
            JSONStream.stringify(), // thought: non standard
            new Writable({
                objectMode: true,
                write(chunk, encoding, callback) {
                    callback();
                }
            })
        );

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
