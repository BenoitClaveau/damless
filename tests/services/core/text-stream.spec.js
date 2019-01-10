/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../../index");
const fs = require("fs");

describe("json-stream", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 } })
            .start();
    })
    afterEach(async () => await damless.stop());

    it("send text", async () => {
        await damless
            .get("/", (context, stream, headers) => {
                stream
                    .mode("object")
                    .respond({
                        contentType: "text/html"
                    })
                    .end({
                        message: "this is not a text but a js object."
                    });
            })
            .start();
        const client = await damless.resolve("client");
        const res = await client.get("http://localhost:3000/");
        expect(res.statusCode).to.be(200);
        expect(res.body).to.be("[object Object]");
    });

});
