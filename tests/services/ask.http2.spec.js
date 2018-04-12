/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamBreaker = require("../../index");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let dambreaker;
beforeEach(() => dambreaker = new DamBreaker({ dirname: __dirname, config: { 
    http2: { 
        port: 8443, 
        cert: `${__dirname}/../certificates/certificate.pem`,
        key: `${__dirname}/../certificates/private-key.pem`,
    },
}}));
afterEach(async () => await dambreaker.stop());

describe("http2 ask", () => {

    it("post object -> object", async () => {
        dambreaker.inject("info", "./info");
        await dambreaker.start();
        await dambreaker.post("/save", "info", "saveOne");

        const client = await dambreaker.resolve("client");
        const res = await client.post({ url: "https://localhost:8443/save", rejectUnauthorized: false, json: {
            name: "ben",
            value: 0,
            test: 454566
        }});
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    }).timeout(60000);
    
    it("upload image", async () => {
        dambreaker.inject("info", "./info");
        await dambreaker.start();
        await dambreaker.post("/upload", "info", "uploadImage");
        
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
