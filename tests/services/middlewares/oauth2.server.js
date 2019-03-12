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
const ClientOAuth2 = require('client-oauth2');

const OAuth2Server = require('oauth2-server');

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

const config = {
    accessToken: '4430eb16f4f6577c0f3a15fb6127cbf828a8e403',
    refreshToken: '4430eb16f4f6577c0f3a15fb6127cbf828a8e403'.split('').reverse().join(''),
    refreshAccessToken: 'def456token'
}

const service = new class {

    register(context, stream, headers) {
        stream
            .respond({
                statusCode: 200,
                contentType: "text/html"
            })
            .end(`
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div>
            <h2>avant d'utiliser notre API OAuth vous devez vous enregistrer</h2>
            <h2>Pour la simulation voici vos informations</h2>
            <div>
                <div>client id: 0oajpaoqak67Bm7Dh0h7</div>
                <div>client_secret: I3Uz307W2g-UxepmkiZJvFKAczGd2UmcaAzUc4F7</div>
                <div>login: encouraging-alpaca@example.com</div>
                <div>password: Selfish-Curlew-Famous-Gerbil-9</div>
            </div>
        </div>
    </body>
</html>
`)
    }

    /**
     * Formulaire de demander d'autorisation
     */
    authorization(context, stream, headers) {
        stream
            .respond({
                statusCode: 200,
                contentType: "text/html"
            })
            .end(`
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div>
            <a
                href="http://localhost:2999/register"
            >Information d'enregistrement</a>
            <h2>Autoriser la connexion AOuth2</h2>
            <a
                href="http://localhost:2999/oauth2/authorize?response_type=code&client_id=0oajpaoqak67Bm7Dh0h7&&redirect_uri=http://localhost:2999/callback&scope=photo+offline_access&state=5GsJXQWm6WXKgKJa"
            >J'autorise</a>
        </div>
    </body>
</html>
`)
    }

    /**
     * Formulaire de connexion
     */
    signin(context, stream, headers) {
        stream
            .respond({
                statusCode: 200,
                contentType: "text/html"
            })
            .end(`
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <form 
            method="POST" 
            action="http://localhost:2999/signin"
        >
            <h2>Se connecter</h2>
            <input 
                type="text" 
                placeholder="Nom d&#39;utilisateur"
                name="username"
                id="username"
                value=""
                aria-label="Nom d&#39;utilisateur"
                autocomplete="off"
            >
            <input 
                type="password" 
                placeholder="Mot de passe"
                name="password"
                id="password"
                value=""
                aria-label="Mot de passe"
                autocomplete="off"
            >
            <button type="submit">Valider</button>
        </form>
    </body>
</html>
`)
    }

    postSignin(context, stream, headers) {

        stream.end();
    }

    callback(context, stream, headers) {
        stream
            .respond({
                statusCode: 200,
                contentType: "text/html"
            })
            .end(`
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <h2>Je suis la callback</h2>
    </body>
</html>
`)
    }
}

new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2999 } })
    .use("oauth2")
    .inject("service", service)
    .get("/oauth2/authorize", "oauth2", "authorize", { auth: false })
    .post("/oauth2/authorize", "oauth2", "authorize", { auth: false })
    .post("/oauth2/access_token", "oauth2", "access_token")
    .post("/oauth2/token_info", "oauth2", "token_info")

    .get("/register", "service", "register", { auth: false })
    .get("/", "service", "authorization", { auth: false })
    .get("/signin", "service", "signin", { auth: false })
    .post("/signin", "service", "postSignin", { auth: false })
    .get("/callback", "service", "callback", { auth: false })
    .start();


// const oauth = new OAuth2Server({
//   model: require('./model')
// });

// const Request = OAuth2Server.Request;
// const Response = OAuth2Server.Response;

// const service2 = new class {
//     async authenticate(context, stream, headers) {
//         const token = await oauth.authenticate(new Request(stream), new Response(stream));
//     }

//     async authorize(context, stream, headers) {
//         const code = await oauth.authorize(new Request(stream), new Response(stream));
//     }

//     async token(context, stream, headers) {
//         const token = await oauth.token(new Request(stream), new Response(stream));
//     }
// }

// new DamLess()
//     .cwd(__dirname)
//     .config({ http: { port: 2998 } })
//     .inject("service")
//     .get("/oauth2/authorize", "oauth2", "authorize")
//     .start();

// var bodyParser = require('body-parser');
// var express = require('express');
// var OAuthServer = require('express-oauth-server');

// var app = express();

// app.oauth = new OAuthServer({
//     model: {
//         getAccessToken: function () {
//             var tokenExpires = new Date();
//             tokenExpires.setDate(tokenExpires.getDate() + 1);
//             var token = { user: {}, accessTokenExpiresAt: tokenExpires };
//             return token;
//         },
//         getClient: function () {
//             return { grants: ['authorization_code'], redirectUris: ['http://example.com'] };
//         },
//         saveAuthorizationCode: function () {
//             return { authorizationCode: 123 };
//         },
//         saveToken: function() {
//             return { accessToken: 'foobar', client: {}, user: {} };
//         }

//     }, // See https://github.com/oauthjs/node-oauth2-server for specification
// });

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(app.oauth.authorize());

// app.use(function (req, res) {
//     res.send('Secret area');
// });

// app.listen(3000);