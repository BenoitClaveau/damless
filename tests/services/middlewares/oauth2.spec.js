/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 * cf express-oauth-server
 * https://www.sohamkamani.com/blog/javascript/2018-06-24-oauth-with-node-js/
 * https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github
 * https://www.oauth.com/playground/authorization-code.html
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
    sign(context, stream, headers) {
        stream.end({ token: "12345" });
    };

    callback(context, stream, headers) {
        stream.end();
    };

    register(context, stream, headers) {

    }
}

describe("oauth2", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 } })
            .use("oauth2")
            .inject("service", service)
            .post("/oauth/authorize", "oauth2", "authorize")
            .post("/oauth/access_token", "oauth2", "access_token")
            .post("/oauth/token_info", "oauth2", "token_info")
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

    xit("createToken", async () => {
        // https://www.oauth.com/playground/authorization-code.html
        // https://aaronparecki.com/oauth-2-simplified/#web-server-apps
        // https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
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


    /*
    Flow sur https://www.oauth.com/playground/client-registration.html

    login: angry-lapwing@example.com
    password: Vivacious-Coyote-Clever-Swiftlet-2
    client_id: 0oajpdnxb3P8371KU0h7
    client_secret: 	Rz_BWfY5xYU2VNlY4P8Ll5x0go8pMsT1CAhiK9E0
    Registered Redirect URIs: https://www.oauth.com/playground/authorization-code.html
                               https://www.oauth.com/playground/authorization-code-with-pkce.html
    Supported Grant Types: authorization_code
                           refresh_token
                           implicit
    
    1. open url
    
    https://dev-396343.oktapreview.com/oauth2/default/v1/authorize?
    response_type=code
    &client_id=0oajpaoqak67Bm7Dh0h7
    &redirect_uri=https://www.oauth.com/playground/authorization-code.html
    &scope=photo+offline_access
    &state=5GsJXQWm6WXKgKJa

    2. J'ai été redirigé vers https://dev-396343.oktapreview.com/login/login.htm?fromURI=/oauth2/v1/authorize/redirect?okta_key=JRSyhE1J4Lnoipqwm03bxlYpiMGjUdtTeDsDjgUf_SQ
       qui est un formulaire de connexion

    entrer login + mot de passe
    
    3. J'ai été rediriger vers https://www.oauth.com/playground/authorization-code.html?code=PwqlAMHzXfToOXPg-ZYb&state=5GsJXQWm6WXKgKJa
    avec un nouveau paramêtre ?state=5GsJXQWm6WXKgKJa&code=PwqlAMHzXfToOXPg-ZYb

    4. Echange du code d'autorisation pour obtenir un access_token (code)

    POST https://dev-396343.oktapreview.com/oauth2/default/v1/token
    grant_type=authorization_code
    &client_id=0oajpaoqak67Bm7Dh0h7
    &client_secret=I3Uz307W2g-UxepmkiZJvFKAczGd2UmcaAzUc4F7
    &redirect_uri=https://www.oauth.com/playground/authorization-code.html
    &code=PwqlAMHzXfToOXPg-ZYb

    response ->
    {
        "access_token": "eyJraWQiOiJvLWlnUFVkX2prN2pKNDM1Rl9IdW9pWWluamxhb0lKV0FkMWk0ZU9NQ2FNIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULkYwQ1VIbmVfbUc4VGI2QjRDN2o2dEdUOElsZm5wX1V4N0FFZWtaZFFKMDAuS2pQb0o5VDNOQU5ZRjI3d0ZCWXE3a1pzNEJKdkQ0NHVKOW1DNnVkZGJ6MD0iLCJpc3MiOiJodHRwczovL2Rldi0zOTYzNDMub2t0YXByZXZpZXcuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTU1MjM4NTY1NiwiZXhwIjoxNTUyMzg5MjU2LCJjaWQiOiIwb2FqcGFvcWFrNjdCbTdEaDBoNyIsInVpZCI6IjAwdWpwYmNjY2p1blhjeW83MGg3Iiwic2NwIjpbIm9mZmxpbmVfYWNjZXNzIiwicGhvdG8iXSwic3ViIjoiZW5jb3VyYWdpbmctYWxwYWNhQGV4YW1wbGUuY29tIn0.ALsBowDY_m1jq00MiQNLbqm5UyWcR_mxZFyXBhOn6mpi8LO4hWQqjuzy2NTbrsEwa4Alo84qF2mfUZ3ClNWQM5yDHW9C8Iuma8S3n2bxK_Tcoekngk0R_c38Dx8U06IiXn4vSaiPDw1On6ctIcF3apqDVukTawzeIknypOBwptICAGlu3TIdLb1FfMhxKppoRSI3LfRh0J81zX4HJ-nWUeXjkHnUWhfdfR8lx7a6Z1cKPxXkUhhFYQKlMQrIR4z-UWh_GwJKIY-pQGWFRGHUCaeNg9YSXIaSbSl1CseJi990Ek45XGMy6GWSS_oNB2jrn7-6YDftO2TzMN5DyPuOpQ",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "offline_access photo",
        "refresh_token": "uaiVCQJapHfrgChhaZJHdj6WQ83D9HNhDUFC_JEPMwM"
    }
    */

    /* Flow sur localhost

    login: encouraging-alpaca@example.com
    password: Selfish-Curlew-Famous-Gerbil-9
    client_id: 0oajpaoqak67Bm7Dh0h7
    client_secret: I3Uz307W2g-UxepmkiZJvFKAczGd2UmcaAzUc4F7
    Registered Redirect URIs: http://localhost:3001/authorization
    Supported Grant Types: authorization_code
                           refresh_token
                           implicit

    http://localhost:2999/authorize?
    response_type=code
    &client_id=0oajpaoqak67Bm7Dh0h7
    &redirect_uri=http://localhost:2999/callback
    &scope=photo+offline_access
    &state=5GsJXQWm6WXKgKJa

    2. J'ai été redirigé vers https://dev-396343.oktapreview.com/login/login.htm?fromURI=/oauth2/v1/authorize/redirect?okta_key=JRSyhE1J4Lnoipqwm03bxlYpiMGjUdtTeDsDjgUf_SQ
       qui est un formulaire de connexion

    entrer login + mot de passe
    
    3. J'ai été rediriger vers https://www.oauth.com/playground/authorization-code.html?code=PwqlAMHzXfToOXPg-ZYb&state=5GsJXQWm6WXKgKJa
    avec un nouveau paramêtre ?state=5GsJXQWm6WXKgKJa&code=PwqlAMHzXfToOXPg-ZYb

    4. Echange du code d'autorisation pour obtenir un access_token (code)

    POST https://dev-396343.oktapreview.com/oauth2/default/v1/token
    grant_type=authorization_code
    &client_id=0oajpaoqak67Bm7Dh0h7
    &client_secret=I3Uz307W2g-UxepmkiZJvFKAczGd2UmcaAzUc4F7
    &redirect_uri=https://www.oauth.com/playground/authorization-code.html
    &code=PwqlAMHzXfToOXPg-ZYb

    response ->
    {
        "access_token": "eyJraWQiOiJvLWlnUFVkX2prN2pKNDM1Rl9IdW9pWWluamxhb0lKV0FkMWk0ZU9NQ2FNIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULkYwQ1VIbmVfbUc4VGI2QjRDN2o2dEdUOElsZm5wX1V4N0FFZWtaZFFKMDAuS2pQb0o5VDNOQU5ZRjI3d0ZCWXE3a1pzNEJKdkQ0NHVKOW1DNnVkZGJ6MD0iLCJpc3MiOiJodHRwczovL2Rldi0zOTYzNDMub2t0YXByZXZpZXcuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTU1MjM4NTY1NiwiZXhwIjoxNTUyMzg5MjU2LCJjaWQiOiIwb2FqcGFvcWFrNjdCbTdEaDBoNyIsInVpZCI6IjAwdWpwYmNjY2p1blhjeW83MGg3Iiwic2NwIjpbIm9mZmxpbmVfYWNjZXNzIiwicGhvdG8iXSwic3ViIjoiZW5jb3VyYWdpbmctYWxwYWNhQGV4YW1wbGUuY29tIn0.ALsBowDY_m1jq00MiQNLbqm5UyWcR_mxZFyXBhOn6mpi8LO4hWQqjuzy2NTbrsEwa4Alo84qF2mfUZ3ClNWQM5yDHW9C8Iuma8S3n2bxK_Tcoekngk0R_c38Dx8U06IiXn4vSaiPDw1On6ctIcF3apqDVukTawzeIknypOBwptICAGlu3TIdLb1FfMhxKppoRSI3LfRh0J81zX4HJ-nWUeXjkHnUWhfdfR8lx7a6Z1cKPxXkUhhFYQKlMQrIR4z-UWh_GwJKIY-pQGWFRGHUCaeNg9YSXIaSbSl1CseJi990Ek45XGMy6GWSS_oNB2jrn7-6YDftO2TzMN5DyPuOpQ",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "offline_access photo",
        "refresh_token": "uaiVCQJapHfrgChhaZJHdj6WQ83D9HNhDUFC_JEPMwM"
    }
    */

});