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
afterEach(async () => await damless.unload());

describe("head", () => {

    it("/info", async () => {
        damless.inject("info", "../services/info");
        await damless.start();
        await damless.get("/info", "info", "getInfo");

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
