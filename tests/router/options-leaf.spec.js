/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamBreaker = require("../../index");
const request = require("request");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let dambreaker;
beforeEach(() => dambreaker = new DamBreaker({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await dambreaker.unload());

describe("options-leaf", () => {

    it("/info", async () => {
        dambreaker.inject("info", "../services/info");
        await dambreaker.start();
        await dambreaker.post("/info", "info", "getInfo");

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
