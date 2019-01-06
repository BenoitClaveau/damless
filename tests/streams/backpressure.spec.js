const expect = require("expect.js");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const { 
    inspect, 
    promisify 
} = require('util');
const { 
    Readable, 
    Transform, 
    Duplex, 
    Writable,
    pipeline: pipelineSync
} = require('stream');

const pipeline = promisify(pipelineSync);

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});


const delay = (action) => {
    setTimeout(() => {
        if(action())
            delay(action)
    }, 10)
}

describe("duplex stream", () => {


    it("readable -> writable", async () => {
        let cpt = 0;
        const readable = new Readable({ read: () => {
            delay(() => {
                this.push(++cpt);
                return cpt < 100;
            })
        }});

        const writable = new Writable({ write(chunk, encoding, callback) {
            console.log(chunk);
            callback();
        }});

        await pipeline(
            readable,
            writable
        )
    });

    xit("readable -> transform -> writable", async () => {
        let cpt = 0;
        const readable = new Readable({ read: () => {
            delay(() => {
                this.push(++cpt);
            })
        }});

        const transform = new Transform({ 
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
            }
        });
        
        const writable = new Writable({ write(chunk, encoding, callback) {
            callback();
        }});

        readable.pipe(transform).pipe(writable); //eror
        readable.push("command 1");
        readable.push("command 2");
        readable.push(null);
    });
});
