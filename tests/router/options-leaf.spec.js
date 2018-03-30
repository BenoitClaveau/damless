/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const request = require("request");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let qwebs;
beforeEach(() => qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await qwebs.unload());

describe("options-leaf", () => {

    it("/info", async () => {
        qwebs.inject("http", "../../index");
        qwebs.inject("info", "../services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        await http.post("/info", "info", "getInfo");

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
