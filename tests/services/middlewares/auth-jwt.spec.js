/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Auth = require("../../../lib/services/middlewares/auth-jwt");
const DamLess = require("../../../index");
const expect = require("expect.js");

const config = {
    http: {
        port: 3000,
        jwt: {
            secret: "01234"
        }
    }
}

describe("auth-jwt", () => {

    it("encode", () => {
        const auth = new Auth(config);
        const payload = {
            name: "My Name",
            version: 3
        }
        expect(auth.encode(payload)).not.to.be(undefined);
    });

    it("decode", () => {
        const auth = new Auth(config);
        const payload = {
            name: "My Name",
            version: 3
        }
        const token = auth.encode(payload);
        const payload2 = auth.decode(token);
        expect(payload2.name).to.be("My Name");
        expect(payload2.version).to.be(3);
    });

    it("identify", async () => {
        const damless = new DamLess();

        try {
            await damless
                .cwd(__dirname)
                .config(config)
                .use("auth-jwt") // use auth2 middleware
                .inject("info", "../info")
                .get("/info", "info", "httpAuthInfo")
                .post("/connect", "info", "connect", { auth: false })
                .start();

            const client = await damless.resolve("client");
            try {
                const res1 = await client.get({ url: "http://localhost:3000/info", json: true });
                throw new Error("Mustn't be executed.")
            }
            catch(error) {
                expect(error.statusCode).to.be(401)
            }
            const res2 = await client.post({ url: "http://localhost:3000/connect", json: { id: 1024 }});
            expect(res2.body.token).not.to.be(null);
            const res3 = await client.get({ url: "http://localhost:3000/info", auth: { "bearer": res2.body.token }, json: true });
            expect(res3.body).to.eql({ text: "I'm Info service." });
        }
        finally {
            damless.stop();
        }
    }).timeout(5000);

    it("override auth-jwt", async () => {
        const damless = new DamLess();

        try {
            await damless
                .cwd(__dirname)
                .config(config)
                .inject("info", "../info")
                .inject("auth-jwt", class extends Auth {
                    decode(payload, secret) {
                        return "HI";
                    }
                })
                .use("auth-jwt") // use auth2 middleware
                .get("/info", (context, stream, headers) => {
                    expect(context.auth.payload).to.be("HI");
                    stream
                        .mode("object")
                        .end({ ok: 1 });
                })
                .post("/connect", "info", "connect", { auth: false })
                .start();

            const client = await damless.resolve("client");
            const res2 = await client.post({ url: "http://localhost:3000/connect", json: { id: 1024 }});
            expect(res2.body.token).not.to.be(null);
            const res3 = await client.get({ url: "http://localhost:3000/info", auth: { "bearer": res2.body.token }, json: true });
            expect(res3.body).to.eql({ ok: 1 });
        }
        finally {
            damless.stop();
        }
    }).timeout(5000);
});