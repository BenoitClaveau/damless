/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Auth2 = require("../../lib/services/auth2");
const DamLess = require("../../index");
const expect = require("expect.js");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("auth2", () => {

    it("identify", async () => {
        await damless.start();
        
        const client = await damless.resolve("client");
        //const res1 = await client.get({ url: "http://localhost:3000/info", json: true });
    });
});