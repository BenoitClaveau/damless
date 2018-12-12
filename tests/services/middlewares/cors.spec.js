/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const DamLess = require("../../../index");
const expect = require("expect.js");

describe("cors middleware", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ 
                http: { 
                    port: 3000, 
                }
            })
            .use("cors")
            .inject("info", "../info")
            .get("/hello", "info", "helloworld")
            .start();
    })
    afterEach(async () => await damless.stop());

    it("cors middleware headers", async () => {
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/hello", json: true });
        expect(res.body).to.be("Hello world.");
        expect(res.headers["access-control-allow-headers"]).to.be("Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
        expect(res.headers["access-control-allow-methods"]).to.be("*");
        expect(res.headers["access-control-allow-origin"]).to.be("*");
        expect(res.headers["access-control-max-age"]).to.be("3600");
    }).timeout(5000);
});