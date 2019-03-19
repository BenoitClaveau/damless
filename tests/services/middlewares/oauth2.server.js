/*!
 * damless-auth-jwt
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 * cf express-oauth-server
 */

const DamLess = require("../../../index");
const expect = require("expect.js");
const process = require("process");
const request = require("request");
const fetch = require("node-fetch");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

class OAuth {

    constructor(oauth2) {
        this.oauth2 = oauth2;
    }

    getLogin(context, stream, headers) {
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
            method="post" 
            action="/login?redirect_uri=${context.query.redirect_uri}"
        >
            <h2>Serveur d'authentification</h2>
            <h2>Merci de vous connecter</h2>
            <input 
                type="text" 
                placeholder="Nom d&#39;utilisateur"
                name="username"
                id="username"
                value=""
                aria-label="Nom d&#39;utilisateur"
                autocomplete="off"
                required
                autofocus
            >
            <input 
                type="password" 
                placeholder="Mot de passe"
                name="password"
                id="password"
                value=""
                aria-label="Mot de passe"
                autocomplete="off"
                required
            >
            <button type="submit">Valider</button>
        </form>
    </body>
</html>
`)
    }

    postLogin(context, stream, headers) {


        // TODO chercher l'acces_token en base

        // stream.redirect(`${context.query.redirect_uri}?access_token=${access_token}`, {
        //     statusCode: 303 // pattern PRG
        // });

        // TODO real login

        const token = Buffer.from(`coco:secret`).toString("base64");

        const {
            redirect_uri,
            client_id
        } = context.query

        // Je ne sais pas comment passer l'acces_token
        // Il faut peut-être faire un request


        request({
            method: "POST",
            url: `${headers.origin}/oauth/authorize`,
            headers: { 'Authorization': `Basic ${token}` }
        }).on('response', (response) => response.pipe(stream))

        // stream.redirect(`${redirect}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}`? {

        // });
    }

    hello(context, stream, headers) {

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
        <h2>Hello ${context.auth ? context.auth.user.name : ''}</h2>
    </body>
</html>
`)
    }
}

class Resource {

    index(context, stream, headers) {
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
        <h2>Serveur de ressource</h2>
        <div>client_id: 1234</div>
        <div>
            <a
                href="http://localhost:2998/oauth/authorize?response_type=code&client_id=1234&redirect_uri=http://localhost:2999/callback&scope=read"
            >Authorization Code Flow</a>
        </div>

        <div>
        <a
            href="http://localhost:2998/private?access_token=${context.query.access_token}"
        >Accès privé serveur OAuth</a>
        </div>
        <div>
            <a
                href="http://localhost:2998/public?access_token=${context.query.access_token}"
            >Accès public serveur OAuth</a>
        </div>
        <div>
            <a
                href="http://localhost:2999/private?access_token=${context.query.access_token}"
            >Accès privé serveur de ressource</a>
        </div>
        <div>
            <a
                href="http://localhost:2999/public?access_token=${context.query.access_token}"
            >Accès public serveur de ressource</a>
        </div>
    </body>
</html>
`)
    }

    //     callback(context, stream, headers) {
    //         stream
    //             .respond({
    //                 statusCode: 200,
    //                 contentType: "text/html"
    //             })
    //             .end(`
    // <html>
    //     <head>
    //         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     </head>
    //     <body>
    //         <h2>Je suis la callback</h2>
    //         <ul>
    //             <li>${context.query.access_token}</li>
    //         </ul>
    //     </body>
    // </html>
    // `)
    //     }

    hello(context, stream, headers) {

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
        <h2>Hello ${context.auth ? context.auth.user.name : ''}</h2>
    </body>
</html>
`)
    }
}

console.log("serveur d'authentification port: 2998");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2998 } })
    .use("oauth2")
    .inject("service", OAuth)
    .get("/login", "service", "getLogin", { auth: false })
    .post("/login", "service", "postLogin", { auth: false })

    .get("/oauth/authorize", "oauth2", "authorize", { auth: false })
    .post("/oauth/authorize", "oauth2", "authorize", { auth: false })

    .post("/oauth/token", "oauth2", "access_token")
    //pour simuler une api
    .get("/private", "service", "hello")
    .get("/public", "service", "hello", { auth: false })

    .start();


const credentials = {
    client: {
        id: 'client-id',
        secret: 'client-secret'
    },
    auth: {
        tokenHost: 'http://localhost:2998'
    }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

console.log("serveur de ressource port: 2999");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2999 } })
    .inject("service", Resource)
    .get("/", "service", "index", { auth: false })
    .get("/login", async (context, stream, headers) => {

        const authorizationUri = oauth2.authorizationCode.authorizeURL({
            redirect_uri: 'http://localhost:2999/callback',
            scope: 'scope', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
            state: 'state'
        });
    
        const res = await fetch(authorizationUri, {
            method: "GET"
        });

        stream.end();

    }, null, { auth: false })
    
    .get("/callback", async (context, stream, headers) => {
        console.log("CALLBACK code", context.query.code);
        // je domande un access token
        const tokenConfig = {
            code: context.query.code,
            redirect_uri: 'http://localhost:2999/callback',
            scope: '<scope>', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
        };

        try {
            const result = await oauth2.authorizationCode.getToken(tokenConfig)
            const accessToken = oauth2.accessToken.create(result);
        } catch (error) {
            console.log('Access Token Error', error.message);
        }


    }, null, { auth: false })
    //pour simuler une api
    .get("/private", "service", "hello")
    .get("/public", "service", "hello", { auth: false })

    .start();


/*
http://jlabusch.github.io/oauth2-server/

CLIENT_ID: 1234


1. Registration
    Application name, Callback URL -> Client ID, Client Secret

2. Authorization Code Flow (for server-side application)

    http://localhost:2998/oauth2/authorize?response_type=code&client_id=1234&redirect_uri=http://localhost:2999/callback&scope=read

*/


/*----------------------------*/

var bodyParser = require('body-parser');
var express = require('express');
var OAuthServer = require('express-oauth-server');

var app = express();

const tokens = [];
const clients = [{ clientId: 'thom', clientSecret: 'nightworld', redirectUris: [''] }];
const users = [{ id: '123', username: 'thomseddon', password: 'nightworld' }];

app.oauth = new OAuthServer({
    model: {
        getAccessToken(bearerToken) {
            var tokens = tokens.filter(token => {
                return token.accessToken === bearerToken;
            });
            return tokens.length ? tokens[0] : false;
        },
        getRefreshToken(bearerToken) {
            var tokens = tokens.filter(token => {
                return token.refreshToken === bearerToken;
            });

            return tokens.length ? tokens[0] : false;
        },
        getClient(clientId, clientSecret) {
            var clients = clients.filter(function (client) {
                return client.clientId === clientId && client.clientSecret === clientSecret;
            });

            return clients.length ? clients[0] : false;
        },
        saveToken(token, client, user) {
            tokens.push({
                accessToken: token.accessToken,
                accessTokenExpiresAt: token.accessTokenExpiresAt,
                clientId: client.clientId,
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                userId: user.id
            });
        },
        getUser(username, password) {
            var users = this.users.filter(user => {
                return user.username === username && user.password === password;
            });

            return users.length ? users[0] : false;
        }

    },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(app.oauth.authorize());

app.use(function (req, res) {
    res.send('Secret area');
});

app.listen(3009);