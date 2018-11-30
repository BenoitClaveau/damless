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

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("Repository", () => {
    
    it("keys", async () => {
        const repositoryFactory = await damless.resolve("repository-factory");
        let repository = repositoryFactory.create(__dirname);
        var properties = Object.keys(repository);
        expect(properties.length).to.be(0);
    });
});