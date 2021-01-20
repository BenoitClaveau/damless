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
const FormData = require('form-data');
const FileType = require("file-type")
const pipeline = promisify(stream.pipeline);
const finished = promisify(stream.finished);

describe("askreply", () => {

    let damless;
    beforeEach(async () => {
        damless = new DamLess()
            .cwd(__dirname)
    })
    afterEach(async () => await damless.stop());

    it("post json array", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", async(context, stream, headers) => {
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

        await new Promise(async(resolve, reject) => {
            await pipeline(
                fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
                request.post('http://localhost:3000/', (err, res, body) =>{
                    if (err) 
                        reject(err);
                    else if (res.statusCode !== 200 ) 
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

        await new Promise(async(resolve, reject) => {
            await pipeline(
                fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
                request.post('http://localhost:3000/', (err, res, body) =>{
                    if (err) 
                        reject(err);
                    else if (res.statusCode !== 200 ) 
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
            body: JSON.stringify([1,2,3,4])
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
                    }).once("error", error => {
                        s.respond({ statusCode: 403 }).end();
                    }),
                    s,
                    err => {
                        // Je réponds une erreur http 403
                        // expect(err.message).to.eql("reading error");
                        // s.respond({ statusCode: 403 }).end();
                    }
                )
            })
            .start();

        
        // const response = await fetch(`http://localhost:3000/`, {
        //     method: "POST",
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         name: "ben",
        //         value: 0,
        //         test: 454566
        //     })
        // })
        // expect(response.status).to.be(403);
        

       await new Promise(async(resolve, reject) => {
        await pipeline(
            fs.createReadStream(`${__dirname}/../data/npm.light.array.json`),
            request({
                url: 'http://localhost:3000/',
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
            }, (err, res, body) =>{
                if (err) 
                    reject(err);
                else if (res.statusCode !== 200 ) 
                    reject("statusCode !== 200");
            }),
            output
        );
        resolve();
    })

    }).timeout(20000);

    it("forget to send an http error in pipeline", async () => {
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        // request error must be sent
        expect(response.status).to.be(500);
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


    xit("post file wit form-data", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .post("/", (context, s, headers) => {
                stream.pipeline(
                    s,
                    new Transform({
                        async transform(chunk, encoding, callback) {
                            const type = await FileType.fromBuffer(chunk);
                            callback(new Error("reading error"));
                        }
                    }),
                    s,
                    err => {
                        // Je réponds une erreur http 403
                        // expect(err.message).to.eql("reading error");
                        s.respond({ statusCode: 403 }).end();
                    }
                )
            }, { readableObjectMode: false })
            .start();

            const form = new FormData();
            form.append('file', fs.createReadStream(`${__dirname}/../data/world.png`));
            const response = await fetch('http://localhost:3000/', {method: 'POST', body: form});
            expect(response.statusCode).to.eql(200);
            // const json = await response.json();
            

    }).timeout(20000);

    it("detect content-type", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .put("/", (context, s, headers) => {
                stream.pipeline(
                    s,
                    new Transform({
                        async transform(chunk, encoding, callback) {
                            const type = await FileType.fromBuffer(chunk);
                            callback(new Error("reading error"));
                        }
                    }),
                    s.response,
                    err => {
                        // Je réponds une erreur http 403
                        // expect(err.message).to.eql("reading error");
                        s.respond({ statusCode: 403 }).end();
                    }
                )
            }, { readableObjectMode: false })
            .start();

            await new Promise(async(resolve, reject) => {
                //fs.createReadStream(`${__dirname}/../data/npm.light.array.json`)
                fs.createReadStream(`${__dirname}/../data/world.png`)
                    .pipe(request.put('http://localhost:3000/', (err, http, body) =>{
                        err && console.log(err);
                        http && console.log(http);
                        resolve()
                    }))
            });

        await new Promise(async(resolve, reject) => {
            await pipeline(
                fs.createReadStream(`${__dirname}/../data/world.png`),
                request({
                    url: 'http://localhost:3000/',
                    method: "POST",
                    headers: { 'Content-Type': 'image/png', "Content-Length": 14565 },
                }, (err, res, body) =>{
                    if (err) 
                        reject(err);
                    else if (res.statusCode !== 200 ) 
                        reject("statusCode !== 200");
                }),
                output
            );
            resolve();
        })

    }).timeout(20000);
});
