/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const request = require("request");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("head", () => {

    it("/info", async () => {
        await damless
                .inject("info", "../services/info")
                .get("/info", "info", "getInfo")
                .start();
        
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
