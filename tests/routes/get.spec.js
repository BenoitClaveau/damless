/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");

describe("get", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .inject("info", "../services/info")
    })
    afterEach(async () => await damless.stop());

    it("/info", async () => {
        await damless
            .get("/info", "info", "getInfo")
            .start();
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/info", json: true })
        expect(res.body[0].text).to.be("I'm Info service.");
    });

    it("timeout option", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                // add timeout to the response.
                //stream.setTimeout(3000);
                // never repond
            }, { timeout: 3000 })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.code).to.be("ECONNRESET");
        }
    }).timeout(5000);

    it("setTimeout", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                // add timeout to the response.
                stream.setTimeout(3000);
            })
            .start();
        const client = await damless.resolve("client");
        try {
            await client.get("http://localhost:3000/");
            throw new Error("Mustn't be called.");
        }
        catch (error) {
            expect(error.code).to.be("ECONNRESET");
        }
    }).timeout(5000);
});
