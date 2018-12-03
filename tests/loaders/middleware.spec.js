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
beforeEach(() => damless = new DamLess({ dirname: __dirname }));
afterEach(async () => await damless.stop());

describe("Load middleware", () => {
    
    it("Load middleware from service.json", async () => {
        await damless
            .start();

        const middleware = await damless.resolve("middleware");
        expect(middleware.middlewares.length).to.be(2);
    }).timeout(5000);
})