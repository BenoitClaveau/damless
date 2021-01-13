/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const request = require("request");

describe("options-leaf", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .inject("info", "../services/info")
            .get("/info", "info", "getInfo")
            .start();
    })
    afterEach(async () => await damless.stop());

    it("/info", async () => {

        const client = await damless.resolve("client");
        const response = await client.request({ 
            method: "OPTIONS",
            url: "http://localhost:3000/info"
        });
        expect(response.headers.allow).to.be("GET");
        expect(response.headers).not.property("content-type");
        expect(response.headers).property("date");
        expect(response.headers).property("expires");
        
    }).timeout(100000);
});
