/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../../index");

describe("ServicesLoader", () => {

    let damless;
    beforeEach(() => 
        damless = new DamLess()
            .cwd(__dirname)
    )
    afterEach(async () => await damless.stop());
    
    it("load", async () => {
        let injector = await damless.resolve("injector");
        expect(Object.entries(injector.container).length).to.be(16);
    });
});
