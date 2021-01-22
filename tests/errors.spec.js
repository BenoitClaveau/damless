/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const { Error } = require("oups");
const DamLess = require("../index");
const { streamify, AskReply, transform } = require("../index");
const stream = require("stream");
const { Transform } = require("stream");
const fetch = require("node-fetch");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

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
        }
    }).timeout(5000);

    it("Forget to throw error", async () => {
        await damless
            .post("/", (context, stream, headers) => {
                stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            expect(chunk.value).to.be(1);
                            callback(new Error("In stream"));
                        }
                    }))
                    .on("error", error => {
                        // Request not close
                        // I musthhave a request timeoutt
                    })
                    .pipe(stream)
            }, { timeout: 3000 }) // Timeout de 3s
            .start();
        const client = await damless.resolve("client");
        try {
            const res = await client.post({
                url: "http://localhost:3000/", json: {
                    value: "1"
                }
            });
            throw new Error("Unexpected");
        }
        catch (error) {
            // Request tiemout
            expect(error.code).to.be("ECONNRESET");
        }
    }).timeout(6000);

    it("Throw error in stream via async pipeline", async () => {
        await damless
            .post("/", async (context, stream, headers) => {
                await pipeline(
                    stream,
                    new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            expect(chunk.value).to.be(1);
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
            throw new Error("Unexpected");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
        }
    }).timeout(5000);

    it("Throw error in streamify", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                try {
                    await pipeline(
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
        }
    }).timeout(5000);

    it("Throw error after the header was sent", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                try {
                    await pipeline(
                        streamify([1, 2, 3]),
                        transform((chunk, encoding) => {
                            if (chunk == 2)
                                throw new Error("In chunk 2.")
                            return chunk.toString();
                        }),
                        stream.respond({
                            contentType: "text/plain"
                        })
                    )
                }
                catch (error) {
                    expect(error.message).to.be("In chunk 2.");
                    stream.respond({ statusCode: 500 });
                    stream.addTrailers({
                        statusCode: 500
                    })
                    stream.end();
                }
            })
            .start();
        const client = await damless.resolve("client");
        const res = await client.get("http://localhost:3000/");
        expect(res.trailers).to.eql({ statuscode: "500" });

    }).timeout(5000);
});