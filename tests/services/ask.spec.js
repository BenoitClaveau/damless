/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const http = require("http");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const util = require('util');

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let qwebs;
beforeEach(() => qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await qwebs.unload());

describe("ask", () => {

    it("post object -> object", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveOne");
        const client = await qwebs.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: {
            name: "ben",
            value: 0,
            test: 454566
        }});
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    });

    it("post object -> array", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveMany");
        const client = await qwebs.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: {
            name: "ben",
            value: 0,
            test: "454566"
        }});
        expect(res.body.length).to.be(1);
        expect(res.body[0].name).to.be("ben");
        expect(res.body[0].value).to.be(0);
        expect(res.body[0].test).to.be("454566");
    });

    it("post array -> object", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveOne");
        const client = await qwebs.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: [
            {
                name: "ben",
                value: 0,
                test: "454566"
            },
            {
                name: "toto",
                value: 32,
                test: "zz"
            }
        ]})
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be("454566");
    });
    
    it("post array -> array", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveMany");
        const client = await qwebs.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: [
            {
                name: "ben",
                value: 0,
                test: "454566"
            },
            {
                name: "toto",
                value: 32,
                test: "zz"
            }
        ]})
        expect(res.body.length).to.be(2);
        expect(res.body[0].name).to.be("ben");
        expect(res.body[0].value).to.be(0);
        expect(res.body[0].test).to.be("454566");
        expect(res.body[1].name).to.be("toto");
        expect(res.body[1].value).to.be(32);
        expect(res.body[1].test).to.be("zz");
    });

    it("upload json stream", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveMany");
        const jsonstream = await qwebs.resolve("json-stream");

        let receive = false;
        let sending = false;

        fs.createReadStream(`${__dirname}/../data/npm.array.json`)
            .on("data", data => {
                if (!sending) console.log("FIRST SENDING", new Date())
                sending = sending || true;
            })
            .on("end", () => {
                console.log("FILE END", new Date())
            })
            .pipe(request.post("http://localhost:3000/save"))
            .on("response", response => {
                expect(response.headers["content-type"]).to.be("application/json");
            })
            .pipe(jsonstream.parse())
            .on("end", data => {
                console.log("REQUEST END", new Date())
            })
            .on("data", data => {
                if (!receive) console.log("FIRST RECEIVE", new Date())
                receive = receive || true;
            })
    });

    it("upload image stream", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/save", "info", "saveMany");
        const jsonstream = await qwebs.resolve("json-stream");

        let receive = false;
        let sending = false;

        fs.createReadStream(`${__dirname}/../data/npm.array.json`)
            .on("data", data => {
                if (!sending) console.log("FIRST SENDING", new Date())
                sending = sending || true;
            })
            .on("end", () => {
                console.log("FILE END", new Date())
            })
            .pipe(request.post("http://localhost:3000/save"))
            .on("response", response => {
                expect(response.headers["content-type"]).to.be("application/json");
            })
            .pipe(jsonstream.parse())
            .on("end", data => {
                console.log("REQUEST END", new Date())
            })
            .on("data", data => {
                if (!receive) console.log("FIRST RECEIVE", new Date())
                receive = receive || true;
            })
    });

    it("upload json stream", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/upload", "info", "saveFile");

        const requestOptions = {
            formData : {
              file : fs.createReadStream(`${__dirname}/../data/npm.array.json`)
            },
            method : "POST",
            url    : "http://localhost:3000/upload",
            json: true
          };
        
        request(requestOptions, (error, response, body) => {
            expect(body.length).to.be(1);
            expect(body[0].filepath).to.be(`${__dirname}/../data/output/npm.array.json`);
        }).on("data", chunk => {
            process.stdout.write(".");
        }).on("response", response => {
            expect(response.headers["content-type"]).to.be("application/json")
        });
    });

    it("upload json object", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/upload", "info", "saveFile");

        const requestOptions = {
            formData : {
              file : fs.createReadStream(`${__dirname}/../data/npm.object.json`)
            },
            method : "POST",
            url    : "http://localhost:3000/upload",
            json: true
          };
        
        request(requestOptions, (error, response, body) => {
            expect(body.length).to.be(1);
            expect(body[0].filepath).to.be(`${__dirname}/../data/output/npm.object.json`);
        }).on("data", chunk => {
            process.stdout.write(".");
        }).on("response", response => {
            expect(response.headers["content-type"]).to.be("application/json")
        });
    });

    it("upload image stream", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/upload", "info", "uploadImage");

        const requestOptions = {
            formData : {
                file : fs.createReadStream(`${__dirname}/../data/world.png`)
            },
            method : "POST",
            url    : "http://localhost:3000/upload"
        };
        
        const filepath = `${__dirname}/../data/output/world.png`;
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

        const output = fs.createWriteStream(filepath);
        
        request(requestOptions, (error, response, body) => {
            //console.log(body)
        }).on("data", chunk => {
            process.stdout.write(".");
        }).on("response", response => {
            expect(response.headers["content-type"]).to.be("image/png");
        }).pipe(output).on("finish", () => {
            expect(fs.existsSync(filepath)).to.be(true);
        });
    });

    
});
