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
        
        const access_token = "Bearer 123456789";

        // TODO chercher l'acces_token en base

        // stream.redirect(`${context.query.redirect_uri}?access_token=${access_token}`, {
        //     statusCode: 303 // pattern PRG
        // });

        // TODO real login


        // redirect = req.body.redirect
        const redirect = "/authorize";

        const {
            redirect_uri,
            client_id
        } = context.query

        // Je ne sais pas comment passer l'acces_token
        // Il faut peut-être faire un request

        stream.redirect(`${redirect}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}`);
    }

    async getAuthorize(context, stream, headers) {
        const {
            respond_type,
            client_id,
            redirect_uri,
            scope,
            state
        } = context.query;

        if (!context.auth)
            return stream.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}`);

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
        <h2>Autorisation</h2>
        <ul>
            <li>${context.query.client_id}</li>
            <li>${context.query.redirect_uri}</li>
        </ul>
    </body>
</html>
`)
    }

    async postAuthorize(context, stream, headers) {
        const {
            respond_type,
            client_id,
            redirect_uri,
            scope,
            state
        } = context.query;

        // if (!context.auth)
        //     return stream.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}`);

        await this.oauth2.authorize(context, stream, headers);
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
                href="http://localhost:2998/authorize?response_type=code&client_id=1234&redirect_uri=http://localhost:2999/callback&scope=read"
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
        <ul>
            <li>${context.query.access_token}</li>
        </ul>
    </body>
</html>
`)
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

console.log("serveur d'authentification port: 2998");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2998 } })
    .use("oauth2")
    .inject("service", OAuth)
    .get("/login", "service", "getLogin", { auth: false })
    .post("/login", "service", "postLogin", { auth: false })

    .get("/authorize", "service", "getAuthorize", { auth: false })
    .post("/authorize", "service", "postAuthorize", { auth: false })

    .post("/token", "oauth2", "token")

    //pour simuler une api
    .get("/private", "service", "hello")
    .get("/public", "service", "hello", { auth: false })

    .start();


console.log("serveur de ressource port: 2999");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2999 } })
    .inject("service", Resource)
    .get("/", "service", "index", { auth: false })
    .get("/callback", "service", "callback", { auth: false })
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