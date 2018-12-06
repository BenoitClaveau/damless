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

describe("Load routes", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config("./damless.json")
            .start();
    })
    afterEach(async () => await damless.stop());

    it("read services.json", async () => {
        const isitget = await damless.resolve("isitasset");
        expect(isitget.nodes.length).to.be(2);
        expect(isitget.nodes[0].token).to.be("main.html");
        expect(isitget.nodes[0].router.route).to.be("/main.html");
        expect(isitget.nodes[1].token).to.be("assets");
        expect(isitget.nodes[1].nodes.length).to.be(1);
        expect(isitget.nodes[1].nodes[0].token).to.be("user.svg");
        expect(isitget.nodes[1].nodes[0].router.route).to.be("/assets/user.svg");
        expect(isitget.nodes[1].nodes[0].router.file).not.to.be(undefined);
    }).timeout(5000);
})