/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const DamLess = require("../../../index");

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("Repository", () => {
   
    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .start();
    })
    afterEach(async () => await damless.stop());

    it("keys", async () => {
        const repositoryFactory = await damless.resolve("repository-factory");
        let repository = repositoryFactory.create(__dirname);
        var properties = Object.keys(repository);
        expect(properties.length).to.be(0);
    });
});