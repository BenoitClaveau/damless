
const { promisify } = require("util");
const stream = require("stream");
const { Writable, Transform } = require("stream");
const pipeline = promisify(stream.pipeline);

const DamLess = require('../../index');
new DamLess()
    .cwd(__dirname)
    .config({
        http: {
            port: 3001
        }
    })
    .get("/", async (context, stream, headers) => {
        stream
            .respond({ 
                statusCode: 200,
                contentType: "text/plain"
            })
            .write("Hello\n")
            .end("World");
    })
    .post("/", async (context, stream, headers) => {
        stream.respond({ contentType: "application/json" })
        await pipeline(
            stream,
            new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                    callback(null, chunk);
                }
            }),
            stream
        ) 
    }, { readableObjectMode: true })
    .use((context, stream, headers) => {
        if ("404" in context.route) {
            stream.end("404")
        }
    })
    .start();