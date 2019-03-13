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

const oauth = new class {
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
        const access_token = "123456789";
        stream.redirect(`${context.query.redirect_uri}?access_token=${access_token}`, {
            statusCode: 303 // pattern PRG
        });
    }

    authorize(context, stream, headers) {
        const {
            respond_type,
            client_id,
            redirect_uri,
            scope,
            state
        } = context.query;

        stream.redirect(`/login?redirect_uri=${redirect_uri}`);
    }
}

const resource = new class {

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
}

console.log("serveur d'authentification port: 2998");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2998 } })
    .use("oauth2")
    .inject("service", oauth)
    .get("/login", "service", "getLogin", { auth: false })
    .post("/login", "service", "postLogin", { auth: false })

    .get("/authorize", "service", "authorize", { auth: false })

    .post("/token", "oauth2", "access_token")
    
    .start();


console.log("serveur de ressource port: 2999");
new DamLess()
    .cwd(__dirname)
    .config({ http: { port: 2999 } })
    .inject("service", resource)
    .get("/", "service", "index", { auth: false })
    .get("/callback", "service", "callback", { auth: false })
    .start();


    /*
    http://jlabusch.github.io/oauth2-server/

    CLIENT_ID: 1234


    1. Registration
        Application name, Callback URL -> Client ID, Client Secret

    2. Authorization Code Flow (for server-side application)

        http://localhost:2998/oauth2/authorize?response_type=code&client_id=1234&redirect_uri=http://localhost:2999/callback&scope=read

    */