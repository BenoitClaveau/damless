/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("routes", () => {
    
    it("read services.json", async () => {
        let qwebs = new Qwebs({ dirname: __dirname });
        await qwebs.load();
        const isitget = await qwebs.resolve("isitget");
        expect(isitget.nodes.length).to.be(1);
        expect(isitget.nodes[0].router.methodName).to.be("getInfo");
        expect(isitget.nodes[0].router.route).to.be("/info");
        expect(isitget.nodes[0].router.serviceName).to.be("info");
        await qwebs.unload();
    }).timeout(5000);
})