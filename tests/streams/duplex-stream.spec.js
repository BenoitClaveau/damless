const expect = require("expect.js");
const { promisify } = require("util");
const stream = require('stream');
const {
    Readable,
    Transform,
    Duplex,
    Writable
} = require('stream');
const pipeline = promisify(stream.pipeline);
const Results = require("../../lib/promises/results");

describe("duplex stream", () => {

    it("readable -> writable", async () => {
        const results = new Results();
        const readable = new Readable({ read() { } });
        const writable = new Writable({
            write(chunk, encoding, callback) {
                results.inc(chunk.toString())
                callback();
            },
            final() {
                results.stop();
            }
        });
        readable.pipe(writable);
        readable.push("command 1");
        readable.push("command 2");
        readable.push(null);

        const data = await results.promise;
        expect(data).to.eql(['command 1', 'command 2']);

    });

    it("readable -> writable events", async () => {
        const results = new Results();
        const readable = new Readable({ read() { } });
        readable
            .on("end", () => console.log("readable.end()"))
            .on("close", () => console.log("readable.close()"))
            .on("finish", () => console.log("readable.finish()"))

        const writable = new Writable({
            write(chunk, encoding, callback) {
                results.inc(chunk.toString())
                callback();
            },
        });
        readable
            .on("end", () => console.log("writable.end()"))
            .on("close", () => console.log("writable.close()"))
            .on("finish", () => console.log("writable.finish()"))

        setTimeout(() => {
            readable.push("command 1");
            readable.push("command 2");
            readable.push(null);
        }, 500)

        await pipeline(
            readable,
            writable
        )
        const data = results.buffer;
        expect(data).to.eql(['command 1', 'command 2']);

    });

    it("readable -> transform -> writable", async () => {
        const readable = new Readable({ read: () => { } });
        const transform = new Transform({
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
            }
        });
        const writable = new Writable({
            write(chunk, encoding, callback) {
                callback();
            }
        });

        readable.pipe(transform).pipe(writable); //eror
        readable.push("command 1");
        readable.push("command 2");
        readable.push(null);
    });


    it("duplex -> transform -> duplex", async () => {
        const duplex = new Duplex({
            read: () => { },
            write(chunk, encoding, callback) {
                callback();
            }
        });
        const transform = new Transform({
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
            }
        });

        duplex.pipe(transform).pipe(duplex);
        duplex.write("command 1");
        duplex.write("command 2");
        duplex.end();
    });

    it("duplex -> duplex", async () => {

        const data = ["command 1", "command 2"];
        const duplex = new Duplex({
            read(n) {
                console.log("[read]", n);
                this.push(data.pop());
            },
            _read(n) {
                console.log("[_read]", n);
            },
            write(chunk, encoding, callback) {
                console.log("[write]", chunk.toString())
                callback();
            },
            _write(chunk, encoding, callback) {
                console.log("[_write]", chunk.toString())
                callback();
            },
        });

        duplex.pipe(duplex);
    }).timeout(30000);

    it("(duplex -> transform) as readable -> duplex", async () => {
        const transform = new Transform({
            transform(chunk, encoding, callback) {
                const data = chunk.toString().toUpperCase();
                console.log("[transform]", data)
                this.push("transformation#1:" + data);
                this.push("transformation#2:" + data);
                callback();
            }
        });

        const data = ["command 1", "command 2"];
        const duplex = new Duplex({
            read(n) {
                console.log("[read]", n);
                const value = data.pop()
                value ? transform.write(value) : transform.end();
            },
            _read(n) {
                console.log("[_read]", n);
            },
            write(chunk, encoding, callback) {
                console.log("[write]", chunk.toString())
                callback();
            },
            _write(chunk, encoding, callback) {
                console.log("[_write]", chunk.toString())
                callback();
            },
        });

        transform.on("data", data => {
            console.log("[on data]", data.toString());
            duplex.push(data)
        })

        duplex.pipe(duplex);
    }).timeout(30000);

    it("duplex -> (transform + writable) as duplex", async () => {
        const transform = new Transform({
            transform(chunk, encoding, callback) {
                const data = chunk.toString().toUpperCase();
                this.push("transformation#1:" + data);
                callback();
            },
        });

        const response = new Writable({
            write(chunk, encoding, callback) {
                const data = chunk.toString();
                callback();
            }
        });

        const data = ["command 1", "command 2"];
        const pile = [];
        const duplex = new Duplex({
            read(n) {
                const value = data.pop();
                this.push(value ? value : null) //Do not use emit to be able to buffer data
            },
            write(chunk, encoding, callback) {
                //console.log("[write]", data.toString())
                transform.write(chunk, encoding, callback);
            },
        });


        transform.on("data", data => {
            response.write(data);
            //duplex.emit("data", data);
            //console.log()
        })

        transform.on("finish", () => {
            response.end();
            duplex.emit("finish")
        });

        duplex.pipe(duplex);



    }).timeout(30000);
});
