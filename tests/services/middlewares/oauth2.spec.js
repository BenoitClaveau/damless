/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const DamLess = require("../../../index");
const expect = require("expect.js");
const process = require("process");
const fetch = require("node-fetch");
const { inspect } = require("util");
const ClientOAuth2 = require('client-oauth2')

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

const config = {
    accessToken: '4430eb16f4f6577c0f3a15fb6127cbf828a8e403',
    refreshToken: '4430eb16f4f6577c0f3a15fb6127cbf828a8e403'.split('').reverse().join(''),
    refreshAccessToken: 'def456token'
}

const info = new class {
    index (context, stream, headers) {
		stream.end({ text: "I'm Info service." });
	};
}

describe("auth2", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .use("oauth2")
            .inject("info", info)
            .post("/oauth/authorize", "oauth2", "authorize")
            .get("/", "info", "index", { auth: true })
            .start();
    })
    afterEach(async () => await damless.stop());

    it("should authenticate the request", async () => {
        const res = await fetch("http://localhost:3000", {
            method: "GET",
            headers: {
                'Authorization': 'Bearer foobar'
            }
        });
        expect(res.ok).to.be(true);

    }).timeout(30000);

    xit("createToken via github", async () => {
        const auth = new ClientOAuth2({
            clientId: 'abc',
            clientSecret: '123',
            accessTokenUri: 'https://github.com/login/oauth/access_token',
            authorizationUri: 'https://github.com/login/oauth/authorize',
            redirectUri: 'http://example.com/auth/github/callback',
            scopes: ['notifications', 'gist']
        });

        const user = auth.createToken(config.accessToken, config.refreshToken, 'bearer');
        user.expiresIn(0);

        var obj = user.sign({
            method: 'GET',
            url: 'http://api.github.com/user',
            headers: {
                'accept': '*/*'
            }
        })
        expect(obj.headers.authorization).to.equal('Bearer ' + config.accessToken)
    }).timeout(20000);

    xit("createToken via damless", async () => {
        const auth = new ClientOAuth2({
            clientId: 'abc',
            clientSecret: '123',
            accessTokenUri: 'http://localhost:3000/oauth/access_token',
            authorizationUri: 'http://localhost:3000/oauth/authorize',
            redirectUri: 'http://example.com/auth/github/callback',
            scopes: ['notifications', 'gist']
        });

        const user = auth.createToken(config.accessToken, config.refreshToken, 'bearer');
        user.expiresIn(0);

        var obj = user.sign({
            method: 'GET',
            url: 'http://localhost:3000/info',
            headers: {
                'accept': '*/*'
            }
        })
        expect(obj.headers.authorization).to.equal('Bearer ' + config.accessToken)
    }).timeout(20000);

});