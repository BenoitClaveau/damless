/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const request = require("request");

describe("head", () => {

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
        const requestOptions = {
            method : "HEAD",
            url    : "http://localhost:3000/info"
        };

        request(requestOptions, (error, response, body) => {
            //TODO
            //expect(response.headers.allow).to.be("POST");
        });
    });
});
