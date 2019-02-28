/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

// https://github.com/oauthjs/node-oauth2-server/blob/master/lib/handlers/token-handler.js

const {
    HttpError,
    Error
} = require("oups");
const { pipeline } = require("stream");
const { promisify } = require("util");
const querystring = require("querystring");
const pipelineAsync = promisify(pipeline);
const { getFirst } = require("../../../index");

class BearerToken {
    constructor(token) {
        this.token = token;
    }
}

class BasicToken {
    constructor(token) {
        this.token = token;
    }
}

class TokenFactory {
    static create(token) {
        let m = token.match(/Bearer\s(\S+)/);
        if (m) return new BearerToken(m[1]);

        m = token.match(/Basic\s(\S+)/);
        if (m) return new BasicToken(m[1]);

        throw new Error('Unknown token format.');
    }
}


class OAuth2Middleware {

    constructor(config) {
        this.config = config;
        this.grantTypes = [];
    };

    async getTokenFromRequest(context, stream, headers) {

        // header
        const headerToken = headers.authorization;
        if (headerToken) return TokenFactory.create(headerToken);

        // body
        const bodyToken = await pipelineAsync(
            stream.mode("object"),
            transform((chunk, encoding) => {
                return chunk.access_token;
            })
        );

        const bodyToken2 = getFirst(pipeline(
            stream.mode("object"),
            transform((chunk, encoding) => {
                return chunk.access_token;
            }),
            error => error && stream.emit("error", error)
        ));


        if (bodyToken) return TokenFactory.create(bodyToken);

        // query
        const queryToken = context.query.access_token;
        if (queryToken) return TokenFactory.create(queryToken);

        throw new Error('Unauthorized request: no authentication given.');
    }


    //must be overrided
    async getAccessToken(token) {

        var tokenExpires = new Date();
        tokenExpires.setDate(tokenExpires.getDate() + 1);

        return {
            user: {},
            accessTokenExpiresAt: tokenExpires
        };
    }

    validateAccessToken(accessToken) {
        if (!accessToken.accessTokenExpiresAt instanceof Date) throw new Error("`accessTokenExpiresAt` must be a Date instance.");
        if (accessToken.accessTokenExpiresAt < new Date()) throw new HttpError(401, "access token has expired.");
    }

    async invoke(context, stream, headers) {
        const token = await this.getTokenFromRequest(context, stream, headers);
        const accessToken = await this.getAccessToken(token);
        this.validateAccessToken(accessToken);
    }

    generateRefreshToken() {
        const accessTokenLifetime = 60 * 60;             // 1 hour.
        const refreshTokenLifetime = 60 * 60 * 24 * 14;  // 2 weeks.
        const allowExtendedTokenAttributes = false;

        return {
            access_token: accessTokenLifetime,
            token_type: 'Bearer',
            expires_in: chunk.accessTokenLifetime,
            refresh_token: chunk.refreshTokenLifetime,
            ...scope && scope,
            ...customAttributes && customAttributes
        };
    }

    /**
     * /oauth/token
     * https://www.oauth.com/playground/authorization-code.html
     * https://aaronparecki.com/oauth-2-simplified/#web-server-apps
     * https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
     */
    async access_token(context, stream, headers) {

        const { method } = context;
        if (method !== "POST") throw new Error("Request method must be POST");
        //if ("application/x-www-form-urlencoded') throw new Error("Request content must be application/x-www-form-urlencoded");

        //const client = await this.getClient();

        //response.set('Cache-Control', 'no-store');
        //response.set('Pragma', 'no-cache');
        await pipelineAsync(
            stream,
            transform((chunk, enc) => {
                const obj = querystring.parse(chunk.toString());
                return obj;
            }),
            transform((chunk, enc) => {
                if (!chunk.grant_type) throw new Error("Missing parameter: `grant_type`");
                return chunk;
            }),
            
            transform((chunk, enc) => {
                if (chunk.grant_type !== "refresh_token") return chunk;
                // TODO generate and save a new refresh token
                return this.generateRefreshToken();
            }),
            stream.respond({
                'cache-control': 'no-store',
                'pragma': 'no-cache'
            })
        );
    }

    /**
     * /authorize
     */
    authorize(context, stream, headers) {
        const { 
            respond_type,
            client_id,
            redirect_uri,
            scope,
            state
        } = context.query;

        // TODO afficher une fentre html
        stream.end();

    }

    /**
     * POST ne doit pas eêtre publié
     * https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
     */
    token_info(context, stream, headers) {
        const token = await this.getTokenFromRequest(context, stream, headers);
        const accessToken = await this.getAccessToken(token);
        stream.end(accessToken);
    }


    signin(context, stream, headers) {
        stream.end(`
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <form 
            method="POST" 
            action="https://dev-396343.oktapreview.com/login/login.htm" 
            data-se="o-form" i
            d="form17" 
            class="primary-auth-form o-form o-form-edit-mode"
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
        </form>
    </body>
</html>
        `)
    }
};

exports = module.exports = OAuth2Middleware;