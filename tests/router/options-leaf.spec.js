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

describe("options-leaf", () => {

    xit("/info", async () => {
        await damless
            .inject("info", "../services/info")
            .get("/info", "info", "getInfo")
            .start();

        const requestOptions = {
            method : "OPTIONS",
            url    : "http://localhost:3000/info"
        };

        request(requestOptions, (error, response, body) => {
            expect(response.headers.allow).to.be("POST");
            expect(response.headers).not.property("content-type");
            expect(response.headers).property("date");
            expect(response.headers).property("expires");
            expect(response.headers).property("content-length");
        });
    });
});
