/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Auth = require("../../lib/services/middlewares/auth-jwt");
const DamLess = require("../../index");
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
        expect(auth.encode(payload)).to.be("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTXkgTmFtZSIsInZlcnNpb24iOjN9.m69S2NJymL3HA08_PWvsJ07WPtjtyPfXCon9A5ckd7E");
    });

    it("decode", () => {
        const auth = new Auth(config);
        const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTXkgTmFtZSIsInZlcnNpb24iOjN9.m69S2NJymL3HA08_PWvsJ07WPtjtyPfXCon9A5ckd7E";
        const payload = auth.decode(token);
        expect(payload.name).to.be("My Name");
        expect(payload.version).to.be(3);
    });

    it("identify", async () => {
        const damless = new DamLess({ dirname: __dirname, config: config });

        try {
            damless.inject("info", "./info")
                   .use("auth-jwt"); // use auth2 middleware

            await damless.start();
            await damless.get("/info", "info", "httpAuthInfo");
            await damless.post("/connect", "info", "connect", { auth: false });
            
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
});