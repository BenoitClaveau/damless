/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { 
    http2: { 
        port: 8443, 
        cert: `${__dirname}/../certificates/certificate.pem`,
        key: `${__dirname}/../certificates/private-key.pem`,
    },
}}));
afterEach(async () => await damless.stop());

describe("http2 ask", () => {

    it("post object -> object", async () => {
        damless.inject("info", "./info");
        await damless.start();
        await damless.post("/save", "info", "saveOne");

        const client = await damless.resolve("client");
        const res = await client.post({ url: "https://localhost:8443/save", rejectUnauthorized: false, json: {
            name: "ben",
            value: 0,
            test: 454566
        }});
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    }).timeout(60000);
    
    xit("upload image", async () => {
        damless.inject("info", "./info");
        await damless.start();
        await damless.post("/upload", "info", "uploadImage");
        
        const requestOptions = {
            formData : {
                file : fs.createReadStream(`${__dirname}/../data/world.png`)
            },
            method : "POST",
            url    : "https://localhost:8443/upload",
            rejectUnauthorized: false
        };

        return new Promise((resolve, reject) => {
            request(requestOptions)
                .on("error", reject)
                .on("data", data => {
                    console.log("[data][Client]", data.length)
                })
                .on("finish", data => {
                    console.log("[finish][Client]", data)
                })
                .pipe(fs.createWriteStream(`${__dirname}/../data/output/world.client.png`))
                .on("finish", resolve)
                .on("error", reject)
        })

         
    }).timeout(30000);
});
