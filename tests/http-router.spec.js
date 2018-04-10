/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { 
    http: { 
        port: 3000, 
    },
}}));
afterEach(async () => await damless.stop());

describe("http-router", () => {

    it("single route", async () => {
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/whoiam", "info", "whoiam");
        await damless.get("/helloworld", "info", "helloworld");
        const client = await damless.resolve("client");
        const res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("multiple route", async () => {
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/whoiam", "info", "whoiam");
        await damless.get("/helloworld", "info", "helloworld");
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route", async () => {
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/helloworld", "info", "helloworld");
        await damless.get("/*", "info", "whoiam");
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route inverted", async () => {
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/*", "info", "whoiam");
        await damless.get("/helloworld", "info", "helloworld");
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple token", async () => {
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/*", "info", "whoiam");
        await damless.get("/*/*", "info", "helloworld");
        const client = await damless.resolve("client");
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
        damless.inject("info", "./services/info");
        await damless.start();
        await damless.get("/whoiam", "info", "whoiam");
        await damless.get("/whoiam", "info", "helloworld");
    });
});