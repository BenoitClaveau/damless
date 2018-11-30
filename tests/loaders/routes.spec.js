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

describe("routes", () => {
    
    it("read services.json", async () => {
        await damless
            .start();
        const isitget = await damless.resolve("isitasset");
        expect(isitget.nodes.length).to.be(2);
        // expect(isitget.nodes[0].router.methodName).to.be("getInfo");
        // expect(isitget.nodes[0].router.route).to.be("/info");
        // expect(isitget.nodes[0].router.serviceName).to.be("info");
    }).timeout(5000);
})