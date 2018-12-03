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

describe("Load assets", () => {

    it("assets", async () => {
        await damless
            .start();

        const isitasset = await damless.resolve("isitasset");
        expect(isitasset.nodes.length).to.be(2);
        expect(isitasset.nodes[0].token).to.be("main.html");
        expect(isitasset.nodes[1].token).to.be("assets");
        expect(isitasset.nodes[1].nodes[0].token).to.be("user.svg");
    });
})