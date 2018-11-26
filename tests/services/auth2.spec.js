/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const Auth2 = require("../../lib/services/auth2");
const DamLess = require("../../index");
const expect = require("expect.js");
const process = require("process");
const { inspect } = require("util");
const ClientOAuth2 = require('client-oauth2')

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

const config = {
    accessToken: '4430eb16f4f6577c0f3a15fb6127cbf828a8e403',
    refreshToken = '4430eb16f4f6577c0f3a15fb6127cbf828a8e403'.split('').reverse().join(''),
    refreshAccessToken = 'def456token'
}

describe("auth2", () => {

    let damless;
    let auth;
    before(async () => {
        damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 } } })
        await damless.start();
        auth = new ClientOAuth2({
            clientId: 'abc',
            clientSecret: '123',
            accessTokenUri: 'https://github.com/login/oauth/access_token',
            authorizationUri: 'https://github.com/login/oauth/authorize',
            redirectUri: 'http://example.com/auth/github/callback',
            scopes: ['notifications', 'gist']
        });

    });
    after(async () => await damless.stop());

    it("createToken", async () => {
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
    });

});