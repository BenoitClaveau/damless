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

describe("get", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .inject("info", "../services/info")
            .get("/info", "info", "getInfo")
            .start();
    })
    afterEach(async () => await damless.stop());

    it("/info", async () => {
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/info", json: true })
        expect(res.body[0].text).to.be("I'm Info service.");
    });
});
