/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamBreaker = require("../../index");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let dambreaker;
beforeEach(() => dambreaker = new DamBreaker({ dirname: __dirname, config: { 
    http: { 
        port: 3000, 
    },
}}));
afterEach(async () => await dambreaker.stop());

describe("http-router", () => {

    it("single route", async () => {
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/whoiam", "info", "whoiam");
        await dambreaker.get("/helloworld", "info", "helloworld");
        const client = await dambreaker.resolve("client");
        const res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("multiple route", async () => {
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/whoiam", "info", "whoiam");
        await dambreaker.get("/helloworld", "info", "helloworld");
        const client = await dambreaker.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route", async () => {
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/helloworld", "info", "helloworld");
        await dambreaker.get("/*", "info", "whoiam");
        const client = await dambreaker.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route inverted", async () => {
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/*", "info", "whoiam");
        await dambreaker.get("/helloworld", "info", "helloworld");
        const client = await dambreaker.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple token", async () => {
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/*", "info", "whoiam");
        await dambreaker.get("/*/*", "info", "helloworld");
        const client = await dambreaker.resolve("client");
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
        dambreaker.inject("info", "./services/info");
        await dambreaker.start();
        await dambreaker.get("/whoiam", "info", "whoiam");
        await dambreaker.get("/whoiam", "info", "helloworld");
    });
});