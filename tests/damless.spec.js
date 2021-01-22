/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../index");
const { ending } = require("../index");
const request = require("request");
const fs = require("fs");
const fetch = require("node-fetch");

describe("damless", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ 
                http: { 
                    port: 3000, 
                }
            })
            .inject("info", "./services/info")
            .post("/save", "info", "saveOne")
            .post("/saves", "info", "saveMany")
            .post("/upload", "info", "uploadImage")
            .start();
    })
    afterEach(async () => await damless.stop());

    it("write json", async () => {
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
                    stream.end({ text: "number 3." })
                }, 1000)
            })
            .start();

        const response = await fetch(`http://localhost:3000/`, {
            method: "GET",
        })
        expect(response.status).to.be(200);
        const data = await response.json();
        expect(data.length).to.be(6);
    }).timeout(5000);

    it("post object -> object", async () => {
        const response = await fetch(`http://localhost:3000/save`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                name: "ben",
                value: 0,
                test: 454566
            })
        })
        expect(response.headers.get("content-type")).to.be("application/json; charset=utf-8");
        const body = await response.json();
        expect(body.name).to.be("ben");
        expect(body.value).to.be(0);
        expect(body.test).to.be(454566);

    });

    it("post object -> array", async () => {
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/saves", json: {
            name: "ben",
            value: 0,
            test: "454566"
        }});
        expect(res.body.length).to.be(1);
        expect(res.body[0].name).to.be("ben");
        expect(res.body[0].value).to.be(0);
        expect(res.body[0].test).to.be(454566);
    });

    it("post array -> object", async () => {
        const client = await damless.resolve("client");
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
        expect(res.body.test).to.be(454566);
    });
    
    it("post array -> array", async () => {
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/saves", json: [
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
        expect(res.body[0].test).to.be(454566);
        expect(res.body[1].name).to.be("toto");
        expect(res.body[1].value).to.be(32);
        expect(res.body[1].test).to.be("zz");
    });

    it("save json stream", async () => {
        const jsonstream = await damless.resolve("json-stream");

        let receive = false;
        let sending = false;

        let cpt = 0;
        await ending(
            fs.createReadStream(`${__dirname}/data/npm.array.json`)
                // .on("data", data => {
                //     if (!sending) console.log("FIRST SENDING", new Date())
                //     sending = sending || true;
                // })
                // .on("end", () => {
                //     console.log("FILE END", new Date())
                // })
                .pipe(request.post("http://localhost:3000/saves"))
                .on("response", response => {
                    expect(response.headers["content-type"]).to.be("application/json; charset=utf-8");
                })
                .pipe(jsonstream.parse())
                .on("end", data => {
                    console.log("REQUEST END", new Date())
                })
                .on("data", data => {
                    if (!receive) console.log("FIRST RECEIVE", new Date())
                    receive = receive || true;
                    //console.log(++cpt, data.key)
                })
        );
    }).timeout(10000);

    it("upload image stream", async () => {
        const jsonstream = await damless.resolve("json-stream");

        let receive = false;
        let sending = false;

        await ending(
            fs.createReadStream(`${__dirname}/data/npm.array.json`)
                .on("data", data => {
                    if (!sending) console.log("FIRST SENDING", new Date())
                    sending = sending || true;
                })
                .on("end", () => {
                    console.log("FILE END", new Date())
                })
                .pipe(request.post("http://localhost:3000/saves"))
                .on("response", response => {
                    expect(response.headers["content-type"]).to.be("application/json; charset=utf-8");
                })
                .pipe(jsonstream.parse())
                .on("data", data => {
                    if (!receive) console.log("FIRST RECEIVE", new Date())
                    receive = receive || true;
                })
                .on("end", () => {
                    console.log("REQUEST END", new Date())
                })
        );
            
    });

});
