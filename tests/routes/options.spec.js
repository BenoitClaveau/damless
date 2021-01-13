/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");

describe("options", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .inject("info", "../services/info")
    })
    afterEach(async () => await damless.stop());
    
    it("get options from /info", async () => {
        await damless
                .get("/info", "info", "getInfo")
                .start();

        const client = await damless.resolve("client");
        const res = await client.request({ 
            method: "OPTIONS",
            url: "http://localhost:3000/info"
        });
        expect(res.headers.allow).to.be("GET");
    });

    it("get options from /info with multiple methods", async () => {
        await damless
                .get("/info", "info", "getInfo")
                .post("/info", "info", "getInfo")
                .put("/info", "info", "getInfo")
                .patch("/info", "info", "getInfo")
                .delete("/info", "info", "getInfo")
                .start();
                
        const client = await damless.resolve("client");
        const res = await client.request({ 
            method: "OPTIONS",
            url: "http://localhost:3000/info"
        })
        expect(res.headers.allow).to.be("GET,POST,DELETE,PUT,PATCH");
    });
});
