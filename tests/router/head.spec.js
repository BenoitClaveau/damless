/*!
 * dam-less
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const GiveMeTheService= require("givemetheservice");
const request = require("request");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let giveme;
beforeEach(() => giveme = new GiveMeTheService({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await giveme.unload());

describe("head", () => {

    it("/info", async () => {
        giveme.inject("http", "../../index");
        giveme.inject("info", "../services/info");
        await giveme.load();
        const http = await giveme.resolve("http");
        await http.get("/info", "info", "getInfo");

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
