const expect = require("expect.js");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const { inspect } = require('util');
const { Readable, Transform, Duplex, Writable } = require('stream');

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("duplex stream", () => {

    xit("readable -> writable", async () => {
        const readable = new Readable({ read() {}});
        const writable = new Writable({ write(chunk, encoding, callback) {
            console.log(chunk.toString())
            callback();
        }});

        readable.pipe(writable);
        readable.push("command 1");
        readable.push("command 2");
        readable.push(null);
    });

    xit("readable -> transform -> writable", async () => {  
        const readable = new Readable({ read: () => {}});
        const transform = new Transform({ transform(chunk, encoding, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
        }});
        const writable = new Writable({ write(chunk, encoding, callback) {
            console.log(chunk.toString())
            callback();
        }});

        readable.pipe(transform).pipe(writable); //eror
        readable.push("command 1");
        readable.push("command 2");
        readable.push(null);
    });


    xit("duplex -> transform -> duplex", async () => { 
        const duplex = new Duplex({ 
            read: () => {},
            write(chunk, encoding, callback) {
                console.log(chunk.toString())
                callback();
            }
        });
        const transform = new Transform({ transform(chunk, encoding, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
        }});

        duplex.pipe(transform).pipe(duplex);
        duplex.write("command 1");
        duplex.write("command 2");
        duplex.end();
    });

    xit("duplex -> duplex", async () => {

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

    xit("(duplex -> transform) as readable -> duplex", async () => {
        const transform = new Transform({ transform(chunk, encoding, callback) {
            const data = chunk.toString().toUpperCase();
            console.log("[transform]", data)
            this.push("transformation#1:" + data);
            this.push("transformation#2:" + data);
            callback();
        }});

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
                console.log("[transform]", data)
                this.push("transformation#1:" + data);
                callback();
            },
        });

        const response = new Writable({ write(chunk, encoding, callback) {
            const data = chunk.toString();
            console.log("[REPONSE]", data)
            callback();
        }});

        const data = ["command 1", "command 2"];
        const pile = [];
        const duplex = new Duplex({
            read(n) {
                const value = data.pop();
                console.log("[read]");
                this.push(value ? value : null) //Do not use emit to be able to buffer data
            },            
            write(chunk, encoding, callback) {
                //console.log("[write]", data.toString())
                transform.write(chunk, encoding, callback);
            },
        });


        transform.on("data", data => {
            console.log("[on data]", data.toString());
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

class MyDuplex extends Duplex {
    constructor(options, transform) {
        super(options);
        this.transform = transform;
    }

    write(chunk, encoding, callback) {
        console.log("[write]", chunk.toString())
        super.write(chunk, encoding, callback)
    }

    _write(chunk, encoding, callback) {
        console.log("[_write]", chunk.toString())
        this.transform.write(chunk, encoding, callback)
    }
}
