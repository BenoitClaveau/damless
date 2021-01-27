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
const FormData = require('form-data');
const fetch = require("node-fetch");
const http = require(`http`);
const pipeline = promisify(stream.pipeline);

describe("readable-wrapper", () => {

    let server;
    afterEach(async () => {
        server && server.close();
    });
    
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
    }).timeout(2000);

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
    }).timeout(2000);

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
    }).timeout(2000);

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

    }).timeout(2000);

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
    }).timeout(2000);


    it("readable http request", async () => {
        server = http.createServer().on("request", async (request, response) => {
            await pipeline(
                new ReadableWrapper(function* () {
                    yield request;
                }, { objectMode: true }),
                new Writable({
                    objectMode: true,
                    write(chunk, encoding, callback) {
                        callback();
                    }
                })
            );
            response.writeHead(403);
            response.end()
        }).listen(3000);


        const form = new FormData();
        form.append('file', fs.createReadStream(`${__dirname}/../data/world.png`));
        const response = await fetch('http://localhost:3000/', { method: 'POST', body: form });
        expect(response.status).to.eql(403);
        
    }).timeout(2000);
});
