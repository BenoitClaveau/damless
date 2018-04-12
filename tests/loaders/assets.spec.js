/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const GiveMeTheService = require("givemetheservice");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let giveme;
beforeEach(() => giveme = new GiveMeTheService({ dirname: __dirname }));
afterEach(async () => await giveme.unload());

describe("Assets loader", () => {

    it("assets", async () => {
        await giveme.load();
        const isitasset = await giveme.resolve("isitasset");
        expect(isitasset.nodes.length).to.be(2);
        expect(isitasset.nodes[0].token).to.be("main.html");
        expect(isitasset.nodes[1].token).to.be("assets");
        expect(isitasset.nodes[1].nodes[0].token).to.be("user.svg");
    });
})