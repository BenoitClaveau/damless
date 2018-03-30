/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let qwebs;
beforeEach(() => qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await qwebs.unload());

describe("http-router", () => {

    it("single route", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/whoiam", "info", "whoiam");
        http.get("/helloworld", "info", "helloworld");
        const client = await qwebs.resolve("client");
        const res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("multiple route", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/whoiam", "info", "whoiam");
        http.get("/helloworld", "info", "helloworld");
        const client = await qwebs.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/helloworld", "info", "helloworld");
        http.get("/*", "info", "whoiam");
        const client = await qwebs.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route inverted", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/*", "info", "whoiam");
        http.get("/helloworld", "info", "helloworld");
        const client = await qwebs.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple token", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/*", "info", "whoiam");
        http.get("/*/*", "info", "helloworld");
        const client = await qwebs.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld/3");
        expect(res.body).to.be("Hello world.");
        res = await client.get("http://localhost:3000/test/3");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple end route", async () => {
        qwebs.inject("http", "../index");
        qwebs.inject("info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("http");
        http.get("/whoiam", "info", "whoiam");
        http.get("/whoiam", "info", "helloworld");
    });
});