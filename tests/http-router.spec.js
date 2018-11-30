/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../index");
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
        await damless
            .inject("info", "./services/info")
            .get("/whoiam", "info", "whoiam")
            .get("/helloworld", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        const res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("multiple route", async () => {
        await damless
            .inject("info", "./services/info")
            .get("/whoiam", "info", "whoiam")
            .get("/helloworld", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route", async () => {
        await damless
            .inject("info", "./services/info")
            .get("/helloworld", "info", "helloworld")
            .get("/*", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route inverted", async () => {
        await damless
            .inject("info", "./services/info")
            .get("/*", "info", "whoiam")
            .get("/helloworld", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple token", async () => {
        await damless
            .inject("info", "./services/info")
            .get("/*", "info", "whoiam")
            .get("/*/*", "info", "helloworld")
            .start();
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
        try {
            await damless
                .inject("info", "./services/info")
                .get("/whoiam", "info", "whoiam")
                .get("/whoiam", "info", "helloworld")
                .start();
            throw new Error("Failed");
        } 
        catch(error) {
            expect(error.message).to.be("Failed the register helloworld of info for GET:/whoiam");
        }
    }).timeout(20000);

    it("add multiple end route after start", async () => {
        try {
            await damless
                .inject("info", "./services/info")
                .get("/whoiam", "info", "whoiam")
                .start();
            
            damless.get("/whoiam", "info", "helloworld");
            await damless.apply(); // need to call apply to apply new config.
            throw new Error("Failed");
        } 
        catch(error) {
            expect(error.message).to.be("Failed the register helloworld of info for GET:/whoiam");
        }
    }).timeout(20000);
});