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

describe("head", () => {

    it("/info", async () => {
        dambreaker.inject("info", "../services/info");
        await dambreaker.start();
        await dambreaker.get("/info", "info", "getInfo");

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
