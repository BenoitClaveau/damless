/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../../index");
const path = require("path");

describe("ServicesLoader", () => {

    let damless;
    beforeEach(() => 
        damless = new DamLess()
    )
    afterEach(async () => await damless.stop());
    
    it("load services via config file", async () => {
        let injector = await damless.resolve("injector");
        expect(Object.entries(injector.container).length).to.be(38);

        await damless
                .cwd(path.join(__dirname, "../../loaders"))
                .config("./services.json")
                .start();
        
        expect(Object.entries(injector.container).length).to.be(46);
    });
});
