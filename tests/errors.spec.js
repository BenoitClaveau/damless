/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const { Error } = require("oups");
const DamLess = require("../index");
const { streamify, AskReply, transform } = require("../index");
const { Transform, pipeline } = require("stream");
const fetch = require("node-fetch");
const process = require("process");
const { promisify } = require("util");
const pipelineAsync = promisify(pipeline);

describe("errors", () => {

    let damless;
    beforeEach(() =>
        damless = new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 } })
    )
    afterEach(async function () {
        this.timeout(5000);
        await damless.stop()
    });

    it("Throw error in get", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                throw new Error("In method");
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In method");
        }
    }).timeout(5000);

    xit("Throw error in get after setTimeout", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                // j'ajoute un timeout à la réponse.
                setTimeout(() => {
                    throw new Error("Uncaught error in timeout.");
                })
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.code).to.be("ECONNRESET");
        }
    }).timeout(5000);

    it("Throw error in stream not the better pattern", async () => {
        await damless
            .post("/", (context, stream, headers) => {
                stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("In stream"));
                        }
                    }))
                    .on("error", error => {
                        stream.emit("error", error); // Must forward error manually
                    })
                    .pipe(stream)
            })
            .start();
        const client = await damless.resolve("client");
        try {
            const res = await client.post({
                url: "http://localhost:3000/", json: {
                    value: "1"
                }
            });
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In stream");
        }
    }).timeout(5000);

    it("Throw error in stream via async pipeline", async () => {
        await damless
            .post("/", async (context, stream, headers) => {
                await pipelineAsync(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("In stream"));
                        }
                    }),
                    stream
                )
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.post({
                url: "http://localhost:3000/", json: {
                    value: "1"
                }
            });
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In stream");
        }
    }).timeout(5000);

    it("Throw error in streamify", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                try {
                    await pipelineAsync(
                        streamify(() => {
                            throw new Error("in streamify");
                        }),
                        stream
                    );
                }
                catch (error) {
                    throw new Error("after pipeline", error);
                }
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("after pipeline");
        }
    }).timeout(5000);

    xit("Throw error after the header was sent", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                try {
                    await pipelineAsync(
                        streamify([1, 2, 3]),
                        transform((chunk, encoding) => {
                            if (chunk == 2)
                                throw new Error("In chunk 2.")
                            return chunk.toString();
                        }),
                        stream.respond({
                            contentType: "text/html"
                        })
                    )
                }
                catch (error) {
                    expect(error.message).to.be("In chunk 2.");
                    throw error;
                }
            })
            .start();
        const client = await damless.resolve("client");
        try {
            const res = await client.get("http://localhost:3000/");
            throw new Error("Error after headerSent. statusCode: ${statusCode}, trailer status: ${trailers.status}.", { statusCode: res.statusCode, trailers: res.trailers });
        }
        catch (error) {
            // expect(error.message).to.be("Error after headerSent. statusCode: 200, trailer status: 500.");
            expect(error.message).to.be("aborted");
        }
    }).timeout(5000);

    it("Customize error page", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                throw new Error("Oops");
            })
            .error((error, context, stream, headers) => {
                expect(error.message).to.be("Oops");

                stream.respond({ 
                    statusCode: 500,
                    contentType: "text/plain"
                }).end("BEURK");
            })
            .start();

        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.body).to.be("BEURK");
        }
    }).timeout(5000);

    xit("writableinit error", async () => {

        let cpt=0;
        await damless
            .get("/", (context, stream, headers) => {
                stream.respond({
                    contentType: "application/json"
                })
                stream.write({ text: "number 3." }),
                stream.write({ text: "number 3." }),
                stream.write({ text: "number 3." }),
                stream.write({ text: "number 3." }),
                stream.write({ text: "number 3." }),
                stream.resume();
                setTimeout(()=> {
                    if (++cpt % 3 == 2)
                        stream.write("error")
                    else 
                        stream.end({ text: "number 3." })
                }, 1000)
            })
            .start();

            const client = await damless.resolve("client");
            await client.get("http://localhost:3000/");

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET",
        })
        expect(response.status).to.be(200);
        const data = await response.json();
        //await new Promise(r => setTimeout(r, 2000000))
        expect(data.length).to.be(3);
    }).timeout(2000000);
});