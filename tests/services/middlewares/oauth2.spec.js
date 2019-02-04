/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 * cf express-oauth-server
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

const service = new class {
    sign (context, stream, headers) {
		stream.end({ token: "12345" });
    };
    
    callback (context, stream, headers) {
		stream.end();
    };
}

describe("oauth2", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .use("oauth2")
            .inject("service", service)
            .post("/oauth/authorize", "oauth2", "authorize")
            .post("/oauth/access_token", "oauth2", "access_token")
            .get("/sign", "service", "sign", { auth: true })
            .get("/callback", "service", "callback", { auth: false })
            .start();
    })
    afterEach(async () => await damless.stop());

    xit("should authenticate the request", async () => {
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
        expect(obj.headers.Authorization).to.equal('Bearer ' + config.accessToken)
    }).timeout(20000);

    xit("createToken via damless", async () => {
        const auth = new ClientOAuth2({
            clientId: 'abc',
            clientSecret: '123',
            accessTokenUri: 'http://localhost:3000/oauth/access_token',
            authorizationUri: 'http://localhost:3000/oauth/authorize',
            redirectUri: 'http://localhost:3000/oauth/callback',
            scopes: ['notifications', 'gist']
        });

        const token = auth.createToken(config.accessToken, config.refreshToken, 'bearer');

        token.expiresIn(1234) // Seconds.
        //token.expiresIn(new Date('2016-11-08')) // Date.

        // Refresh the users credentials and save the new access token and info.
        const storeNewToken = await token.refresh();

        // Sign a standard HTTP request object, updating the URL with the access token
        // or adding authorization headers, depending on token type.
        const req = token.sign({
            method: 'get',
            url: 'https://localhost:3000/sign'
        });

        var uri = auth.code.getUri();
        //const t = await auth.code.getToken(req.originalUrl);

        const client = await damless.resolve("client");
        const res = await client.request(req);


        expect(res).to.be(undefined);
    }).timeout(20000);

});