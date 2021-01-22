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
const FileType = require("file-type")
const pipeline = promisify(stream.pipeline);
const finished = promisify(stream.finished);
const JSONStream = require("JSONStream");
const FormData = require('form-data');
const fetch = require("node-fetch");
const http = require(`http`);
const WritableWrapper = require("../../lib/streams/writable-wrapper");
const ReadableWrapper = require("../../lib/streams/readable-wrapper");
const ReadableWritable = require("../../lib/streams/readable-writable");
const Workflow = require("../../lib/streams/workflow");
const AskReply = require("../../lib/services/askreply");
const Busboy = require("busboy");
const {
    createDeflate,
    createGzip,
    createBrotliCompress
} = require("zlib");

describe("askreply", () => {

    let damless;
    let server;
    beforeEach(async () => {
        damless = new DamLess()
            .cwd(__dirname)
    })
    afterEach(async () => {
        await damless.stop()
        server && server.close();
    });

    it("post json array", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Writable({
                        objectMode: true,
                        write(chunk, encoding, callback) {
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

    it("read and stream json", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                stream.respond({ contentType: "application/json" })
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
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

        await new Promise(async (resolve, reject) => {
            await pipeline(
                fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
                request.post('http://localhost:3000/', (err, res, body) => {
                    if (err)
                        reject(err);
                    else if (res.statusCode !== 200)
                        reject("statusCode !== 200");
                }),
                output
            );
            resolve();
        })

    }).timeout(20000);

    it("read and stream json without content-type", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            chunk.key = chunk.key?.toUpperCase();
                            callback(null, chunk);
                        }
                    }),
                    stream
                )
            })
            .start();

        const filename = `${__dirname}/../data/output/12.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const output = fs.createWriteStream(filename);

        await new Promise(async (resolve, reject) => {
            await pipeline(
                fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
                request.post('http://localhost:3000/', (err, res, body) => {
                    if (err)
                        reject(err);
                    else if (res.statusCode !== 200)
                        reject("statusCode !== 200");
                }),
                output
            );
            resolve();
        })

    }).timeout(20000);

    it("error not catch by user", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, stream, headers) => {
                throw new Error("error not catch by user");
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
        })
        expect(response.status).to.be(500);
    }).timeout(20000);

    it("404", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET",
        })
        expect(response.status).to.be(404);
    }).timeout(20000);

    it("reading error in async pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            expect(chunk.toString()).to.eql("text plain");
                            callback(new Error("reading error"));
                        }
                    }),
                    stream
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            // default header = text/plain => askreply has no pipeline 
            body: "text plain"
        })
        expect(response.status).to.be(500);
    }).timeout(20000);

    it("reading error in async json pipeline", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            expect(chunk).to.eql(1);
                            callback(new Error("reading error"));
                        }
                    }),
                    stream
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([1, 2, 3, 4])
        })
        expect(response.status).to.be(500);
    }).timeout(20000);

    it("error in pipeline before 1st transform", async () => {
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
                    }).once("error", error => {
                        s.respond({ statusCode: 403 }).end();
                    }),
                    s,
                    err => {
                        console.log(err)
                    }
                )
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([1, 2, 3, 4])
        })
        expect(response.status).to.be(403);

    }).timeout(20000);

    it("multiple respond with error in pipeline", async () => {
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
                        // stream,
                        new Writable({
                            objectMode: true,
                            transform(chunk, encoding, callback) {
                                callback();
                            }
                        }),
                    );
                }
                catch (error) {
                    stream.respond({ statusCode: 403, contentType: "application/json" }).end();
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


    it("post file with form-data", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, stream, headers) => {
                let hasFile;
                stream
                .on("file", () => {
                    hasFile = true;
                })
                .on("read", () => {
                    expect(hasFile).to.eql(true);
                    stream.respond({ statusCode: 403 }).end();
                }).resume();
            })
            .start();

        const form = new FormData();
        form.append('file', fs.createReadStream(`${__dirname}/../data/world.png`));
        const response = await fetch('http://localhost:3000/', { method: 'POST', body: form });
        expect(response.status).to.eql(403);
        // const json = await response.json();


    }).timeout(200000);

    it("read and write http request deflate response", async () => {
        server = http.createServer().on("request", async (request, response) => {
            const duplex = new ReadableWritable(function* () {
                yield request;
            }, function* () {
                yield new Workflow(function* () {
                    yield createDeflate();
                });
                yield response;
            }, { objectMode: true })

            duplex.on("read", () => {
                response.writeHead(403, { "content-encoding": "deflate" });
                duplex.end();
            }).resume();

        }).listen(3000);

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        expect(response.status).to.eql(403);

    }).timeout(20000);

    it("wrap request in ReadableWrapper", async () => {
        server = http.createServer().on("request", async (request, response) => {

            const input = new ReadableWrapper(function* () {
                yield request;
            }, { objectMode: true });

            input.on("end", () => {
                response.writeHead(403);
                response.end();
            }).resume();

        }).listen(3000);

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        expect(response.status).to.eql(403);

    }).timeout(20000);

    it("bug with busboy", async () => {
        server = http.createServer().on("request", async (request, response) => {

            let hasFile;
            const input = new ReadableWrapper(function* () {
                yield request;
                const busboy = new Busboy({ headers: request.headers });
                busboy.on("file", (...args) => {
                    hasFile = true;
                });

                stream.pipeline(
                    request,
                    busboy,
                    err => {
                        // BUG Busboy never ended the stream
                        console.log("terminated")
                    }
                )
            }, { objectMode: true });

            input.on("end", () => {
                // I expect to have file
                expect(hasFile).to.eql(true);
                response.writeHead(403);
                response.end();
            }).resume();

            // await new Promise(r => setTimeout(r, 5000));

        }).listen(3000);

        const form = new FormData();
        form.append('file', fs.createReadStream(`${__dirname}/../data/world.png`));
        const response = await fetch('http://localhost:3000/', { method: 'POST', body: form });
        expect(response.status).to.eql(403);

    }).timeout(20000);

    it("wrap response in ReadableWrapper", async () => {
        server = http.createServer().on("request", async (request, response) => {

            const output = new WritableWrapper(function* () {
                yield response;
            }, { objectMode: true });

            response.writeHead(403);
            output.end();

        }).listen(3000);

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET"
        })
        expect(response.status).to.eql(403);

    }).timeout(20000);

    it("AskReply", async () => {
        server = http.createServer().on("request", async (request, response) => {
            const duplex = new AskReply(null, request, response, request.headers, { objectMode: true });
            duplex.on("read", () => {
                duplex.respond({ statusCode: 403 }).end();
            }).resume();
        }).listen(3000);

        const response = await fetch(`http://localhost:3000/`, {
            method: "POST",
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        expect(response.status).to.eql(403);

    }).timeout(20000);
});
