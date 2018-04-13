/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const GiveMeTheService= require("givemetheservice");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("routes", () => {
    
    it("read services.json", async () => {
        let giveme = new GiveMeTheService({ dirname: __dirname });
        await giveme.load();
        const isitget = await giveme.resolve("isitget");
        expect(isitget.nodes.length).to.be(1);
        expect(isitget.nodes[0].router.methodName).to.be("getInfo");
        expect(isitget.nodes[0].router.route).to.be("/info");
        expect(isitget.nodes[0].router.serviceName).to.be("info");
        await giveme.unload();
    }).timeout(5000);
})