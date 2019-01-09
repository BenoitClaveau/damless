/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const { Error } = require("oups");
const DamLess = require("../index");
const { streamify, HttpServer, transform } = require("../index");
const { Transform, pipeline } = require("stream");
const process = require("process");
const { inspect, promisify } = require("util");
const pipelineAsync = promisify(pipeline);

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("errors", () => {

    let damless;
    beforeEach(() =>
        damless = new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 } })
    )
    afterEach(async () => await damless.stop());

    it("Throw error", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                throw new Error("In method");
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In method");
        }
    }).timeout(20000);

    it("Throw error in stream", async () => {
        await damless
            .post("/", (context, stream, headers) => {
                stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(new Error("In stream"));
                        }
                    })).pipe(stream);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.post({
                url: "http://localhost:3000/", json: {
                    value: "1"
                }
            });
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In stream");
        }
    }).timeout(20000);

    it("Throw error in streamify", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                streamify(() => {
                    throw new Error("In streamify");
                })
                    .pipe(stream);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In streamify");
        }
    }).timeout(20000);

    it("Throw error in pipeline async", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                await pipelineAsync(
                    streamify(() => {
                        throw new Error("In pipeline");
                    }),
                    stream
                )
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In pipeline");
        }
    }).timeout(20000);

    xit("Throw error in transform pipeline async", async () => {
        await damless
            .get("/", async (context, stream, headers) => {
                try {
                    await pipelineAsync(
                        streamify([1, 2, 3]),
                        transform((chunk, encoding) => {
                            if (chunk == 2) throw new Error("In chunk 2.")
                            return chunk.toString();
                        }),
                        stream.respond({
                            contentType: "text/html"
                        })
                    )
                }
                catch (error) {
                    throw error;
                }
            })
            .start();
        const client = await damless.resolve("client");
        try {
            const res = await client.get("http://localhost:3000/");
            throw new Error(res.statusCode);
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.message).to.be("In chunk 2.");
        }
    }).timeout(20000);

    // it("Throw error in pipeline", async () => {
    //     await damless
    //         .get("/", (context, stream, headers) => {
    //             try {
    //                 pipeline(
    //                     streamify(() => {
    //                         throw new Error("In pipeline");
    //                     }),
    //                     stream
    //                 )
    //             }
    //             catch (error) {
    //                 throw error;
    //             }
    //         })
    //         .start();
    //     const client = await damless.resolve("client");
    //     try {
    //         await client.get("http://localhost:3000/");
    //         throw new Error();
    //     }
    //     catch (error) {
    //         expect(error.statusCode).to.be(500);
    //         expect(error.data.message).to.be("In pipeline");
    //     }
    // }).timeout(20000);

    it("Override writeError", async () => {
        class MyHttpServer extends HttpServer {
            constructor(injector, config) {
                super(injector, config);
            }

            writeError(error, context, stream, headers) {
                stream.respond({
                    statusCode: 500
                }).end("ok");
            }
        }
        await damless
            .inject("http-server", MyHttpServer)
            .get("/", (context, stream, headers) => {
                streamify(() => {
                    throw new Error("In streamify");
                })
                    .pipe(stream);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500);
            expect(error.data.body).to.be("ok");
        }
    }).timeout(20000);

    it("Override writeError with streamify", async () => {
        class MyHttpServer extends HttpServer {
            constructor(injector, config) {
                super(injector, config);
            }
            writeError(error, context, stream, headers) {
                streamify(() => {
                    return { value: "ok" };
                }).pipe(stream
                    .mode("object")
                    .respond({ statusCode: 500 }));
            }
        }
        await damless
            .inject("http-server", MyHttpServer)
            .get("/", (context, stream, headers) => {
                streamify(() => {
                    throw new Error("In streamify");
                })
                    .pipe(stream);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.data.body.value).to.be("ok");
        }
    }).timeout(20000);

    it("Throw error in writeError", async () => {
        class MyHttpServer extends HttpServer {
            constructor(injector, config) {
                super(injector, config);
            }
            writeError(error, context, stream, headers) {
                streamify(() => {
                    throw new Error("in writeError")
                }).pipe(stream
                    .mode("object")
                    .respond({ statusCode: 500 }));
            }
        }
        await damless
            .inject("http-server", MyHttpServer)
            .get("/", (context, stream, headers) => {
                streamify(() => {
                    throw new Error("In streamify");
                })
                    .pipe(stream);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error();
        }
        catch (error) {
            expect(error.statusCode).to.be(500); // request must be closed
        }
    }).timeout(20000);
});