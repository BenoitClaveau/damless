/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../../index");

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("ServicesLoader", () => {
    
    it("load", async () => {
        let injector = await damless.resolve("injector");
        expect(Object.entries(injector.container).length).to.be(16);
    });
});
