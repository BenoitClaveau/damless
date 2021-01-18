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
const { Writable, Transform } = require("stream");
const request = require("request");
const fetch = require("node-fetch");
const { resolve } = require("path");
const pipeline = promisify(stream.pipeline);
const finished = promisify(stream.finished);

describe("askreply", () => {

    let damless;
    beforeEach(async () => {
        damless = new DamLess()
            .cwd(__dirname)
    })
    afterEach(async () => await damless.stop());

    xit("post json array", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async(context, stream, headers) => {
                await pipeline(
                    stream,
                    new Writable({
                        objectMode: true,
                        write(chunk, encoding, callback) {
                            console.log(chunk);
                            callback();
                        }
                    })
                )
                stream.end(); // respond
            })
            .start();

        await pipeline(
            fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
            request.post('http://localhost:3000/')
        );
    }).timeout(20000);

    xit("read and stream json", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            console.log(chunk);
                            chunk.key = chunk.key?.toUpperCase();
                            callback(null, chunk);
                        }
                    }),
                    stream
                )
            })
            .start();

        const filename = `${__dirname}/../data/output/6.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const output = fs.createWriteStream(filename);

        await pipeline(
            fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
            request.post('http://localhost:3000/'),
            output
        );

    }).timeout(20000);


    xit("basic error", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, stream, headers) => {
                throw new Error("basic error");
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET",
        })
        expect(response.status).to.be(500);
    }).timeout(20000);

    xit("reading error in async pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("reading error"));
                        }
                    }),
                    stream
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET",
        })
        expect(response.status).to.be(500);
    }).timeout(20000);

    xit("error in pipeline before 1st transform", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, s, headers) => {
                stream.pipeline(
                    s,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("reading error"));
                        }
                    }),
                    s,
                    err => {
                        // Je répond une erreur http 403
                        s.respond({ statusCode: 403 }).end();
                    }
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        expect(response.status).to.be(403);
    }).timeout(20000);

    xit("forget to send an http error in pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, s, headers) => {
                stream.pipeline(
                    s,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("reading error"));
                        }
                    }),
                    s,
                    err => {
                        // Bad idea. Error not throw.
                        // Http request must be closed by the http-server (cf invoke).
                    }
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        // request error must be sent
        expect(response.status).to.be(500);
    }).timeout(20000);

    it("forget to send an http error in async pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                try {
                    await pipeline(
                        stream,
                        new Transform({
                            objectMode: true,
                            transform(chunk, encoding, callback) {
                                callback(new Error("reading error"));
                            }
                        }),
                        stream
                    )
                }
                catch(err) {
                    // Bad idea. Error not throw.
                    // Http request must be closed by the http-server (cf invoke).
                }
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        // request error must be sent
        expect(response.status).to.be(500);
    }).timeout(20000);











    xit("multiple respond with error in pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                stream.respond({
                    statusCode: 200,
                    "Content-Disposition": "inline;filename=file.json"
                })
                try {
                    await pipeline(
                        stream,
                        new Transform({
                            objectMode: true,
                            transform(chunk, encoding, callback) {
                                callback(new Error("reading error"));
                            }
                        }),
                        stream
                    );
                }
                catch(error) {
                    stream.respond({ statusCode: 403 }).end();
                }
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        // request error must be sent
        expect(response.status).to.be(403);
        expect(response.headers.get("content-disposition")).to.be("inline;filename=file.json");
    }).timeout(20000);

});
