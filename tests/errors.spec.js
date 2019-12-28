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
const process = require("process");
const { inspect, promisify } = require("util");
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
            expect(res.statusCode).not.to.be(200);
            expect(res.statusCode).not.to.be(500);
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

    it("Throw error after the header was sent async", async () => {
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
            throw new Error("Mustn't be called. statusCode: ${statusCode}, trailer status: ${trailers.status}.", { statusCode: res.statusCode, trailers: res.trailers });
        }
        catch (error) {
            //expect(error.code).to.be("ECONNRESET");
            expect(error.message).to.be("Mustn't be called. statusCode: 200, trailer status: 500.");
        }
    }).timeout(5000);


    it("Override sendError", async () => {
        class MyAskReply extends AskReply {
            constructor(giveme, request, response, headers) {
                super(giveme, request, response, headers);
            }

            sendError(error) {
                this.respond({
                    statusCode: 500
                }).end("ok");
            }
        }
        await damless
            .inject("AskReply", MyAskReply, { instanciate: false })
            .get("/", async (context, stream, headers) => {
                await pipelineAsync(
                    streamify(() => {
                        throw new Error("In streamify");
                    }),
                    stream
                );
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.body).to.be("ok");
        }
    }).timeout(5000);

    it("Override sendError with streamify", async () => {
        class MyAskReply extends AskReply {
            constructor(giveme, request, response, headers) {
                super(giveme, request, response, headers);
            }

            sendError(error) {
                this
                    .mode("object")
                    .respond({ statusCode: 500 })
                    .end({ value: "ok" });
            }
        }
        await damless
            .inject("AskReply", MyAskReply, { instanciate: false })
            .get("/", async (context, stream, headers) => {
                await pipelineAsync(
                    streamify(() => {
                        throw new Error("In streamify");
                    }),
                    stream
                );
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.data.body.value).to.be("ok");
        }
    }).timeout(5000);

    it("Throw error in sendError", async () => {
        class MyAskReply extends AskReply {
            constructor(giveme, request, response, headers) {
                super(giveme, request, response, headers);
            }

            sendError(error) {
                throw new Error("in sendError");
            }
        }
        await damless
            .inject("AskReply", MyAskReply, { instanciate: false })
            .get("/", async (context, stream, headers) => {
                await pipelineAsync(
                    streamify(() => {
                        throw new Error("In streamify");
                    }),
                    stream
                );
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500); // request must be closed
        }
    }).timeout(5000);

    it("Throw error in sendError pipeline", async () => {
        class MyAskReply extends AskReply {
            constructor(giveme, request, response, headers) {
                super(giveme, request, response, headers);
            }

            async sendError(error) {
                try {
                    await pipelineAsync(
                        streamify([1,2,3]),
                        transform((chunk, encoding) => {
                            throw new Error("Boom");
                        }),
                        this
                            .mode("object")
                            .respond({ statusCode: 500 })
                    );
                }
                catch (error) {
                    expect(error.message).to.be("Boom");
                    this
                        .respond({ statusCode: 500 })
                        .end({});
                }
            }
        }

        await damless
            .inject("AskReply", MyAskReply, { instanciate: false})
            .get("/", async (context, stream, headers) => {
                await pipelineAsync(
                    streamify(() => {
                        throw new Error("In streamify");
                    }),
                    stream
                );
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.statusCode).to.be(500); // request must be closed
        }
    }).timeout(5000);
});