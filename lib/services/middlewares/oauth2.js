/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

// https://github.com/oauthjs/node-oauth2-server/blob/master/lib/handlers/token-handler.js
/**
 * /oauth/token
 * https://www.oauth.com/playground/authorization-code.html
 * https://aaronparecki.com/oauth-2-simplified/#web-server-apps
 * https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
 * 
 * https://aaronparecki.com/oauth-2-simplified/#web-server-apps
 * https://github.com/rde8026/node-oauth-server/blob/master/views/login.ejs
 */

const {
    HttpError,
    Error
} = require("oups");
const { pipeline } = require("stream");
const { promisify } = require("util");
const querystring = require("querystring");
const pipelineAsync = promisify(pipeline);
const crypto = require('crypto');

class BearerToken {
    constructor(token) {
        this.value = token;
    }
}

class BasicToken {
    constructor(token) {
        this.value = token;
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

    async invoke(context, stream, headers) {
        try {
            if (/false/.test(context.route.options.auth)) return;

            const accessToken = await this.authenticate(context, stream, headers);
            context.auth = accessToken;
        }
        catch (error) {
            throw new HttpError(401, "Authentication has failed for ${context.method}:${context.url}.", { context, headers }, error);
        }
    }

    async authenticate(context, stream, headers) {

        const options = {
            addAcceptedScopesHeader: true,
            addAuthorizedScopesHeader: true,
            allowBearerTokensInQueryString: false
        };

        const token = await this.getTokenFromRequest(context, stream, headers);
        const accessToken = await this.getAccessToken(token);
        this.validateAccessToken(accessToken);
        this.validateScope(accessToken);
        return accessToken;
        // if (scope && this.addAcceptedScopesHeader) response.set('X-Accepted-OAuth-Scopes', this.scope);
        // if (scope && this.addAuthorizedScopesHeader) response.set('X-OAuth-Scopes', accessToken.scope);
        // context.auth = accessToken;
    }

    async authorize(context, stream, headers) {
        const options = {
            allowEmptyState: false,
            authorizationCodeLifetime: 5 * 60   // 5 minutes.
        }

        const scope = this.getScope(context, stream, headers);
        const expiresAt = this.getAuthorizationCodeLifetime();
        const client = this.getClient(context, stream, headers);
        const redirectUri = this.getRedirectUri(context, stream, headers, client);
        const user = await this.getUser(context, stream, headers);

        const authorizationCode = this.generateAuthorizationCode(client, user, scope);
        const responseType = this.getResponseType(context, stream, headers);
        // en fonction de responsetype la redirection change

        const code = {
            authorizationCode: authorizationCode,
            expiresAt: expiresAt,
            redirectUri: redirectUri,
            scope: scope
        };


        stream.redirect(`${redirectUri}&code=${authorizationCode}`);
    }

    async token(context, stream, headers) {
        const options = {
            accessTokenLifetime: 60 * 60,             // 1 hour.
            refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
            allowExtendedTokenAttributes: false,
            requireClientAuthentication: {}
        }

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

        // const bodyToken2 = await getFirst(pipeline(
        //     stream.mode("object"),
        //     transform((chunk, encoding) => {
        //         return chunk.access_token;
        //     }),
        //     error => error && stream.emit("error", error)
        // ));


        //if (bodyToken) return TokenFactory.create(bodyToken);

        // query
        const queryToken = context.query.access_token;
        if (queryToken)
            return TokenFactory.create(queryToken);

        throw new Error('Unauthorized request: no authentication given.');
    }


    //must be overrided
    async getAccessToken(token) {


        var tokenExpires = new Date();
        tokenExpires.setDate(tokenExpires.getDate() + 1);

        return {
            user: { name: "User-" + token.value },
            accessTokenExpiresAt: tokenExpires
        };
    }

    validateAccessToken(accessToken) {
        if (!accessToken.accessTokenExpiresAt instanceof Date) throw new Error("`accessTokenExpiresAt` must be a Date instance.");
        if (accessToken.accessTokenExpiresAt < new Date()) throw new HttpError(401, "access token has expired.");
    }

    validateScope(accessToken) {

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


    getScope(context, stream, headers) {
        const scope = context.query.scope;
        // TODO body
        return scope;
    }

    getRedirectUri(context, stream, headers, client) {
        const redirect_uri = context.query.redirect_uri || client.redirectUris[0];
        // TODO body
        return redirect_uri;
    }

    getAuthorizationCodeLifetime() {
        const authorizationCodeLifetime = 5 * 60   // 5 minutes. //config

        var expires = new Date();
        expires.setSeconds(expires.getSeconds() + authorizationCodeLifetime);
        return expires;
    }

    getClient(context, stream, headers) {
        const clientId = context.query.client_id;
        const redirectUri = context.query.redirect_uri;
        //TODO body
        if (!clientId) throw new Error('Missing parameter: `client_id`');

        // overide récupérer les info du client
        // trouver le client en fonction du clientID

        const client = {
            grants: ["authorization_code"],
            redirectUris: ["http://localhost:2999/callback"]
        }

        if (!client.grants) throw new Error('Invalid client: missing client `grants`');
        if (!client.grants.some(e => e == "authorization_code")) throw new Error('Unauthorized client: grant_type is invalid');
        if (!client.redirectUris) throw new Error('Invalid client: missing client redirectUri');
        if (!client.redirectUris.some(e => e == redirectUri)) throw new Error('Invalid client: redirect_uri does not match client value');
        return client;
    }

    async getUser(context, stream, headers) {
        const accessToken = await this.authenticate(context, stream, headers);
        return accessToken.user;
    }

    generateAuthorizationCode(client, user, scope) {
        // Peut être modifié
        const buffer = crypto.randomBytes(256);
        return crypto
            .createHash('sha1')
            .update(buffer)
            .digest('hex');
    }

    getResponseType(context, stream, headers) {
        const response_type = context.query.response_type;
        //if (!response_type) throw new Error('Missing parameter: response_type');
        // TODO body
        return response_type;
    }

    /**
     * POST ne doit pas eêtre publié
     * https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
     */
    async token_info(context, stream, headers) {
        const token = await this.getTokenFromRequest(context, stream, headers);
        const accessToken = await this.getAccessToken(token);
        stream.end(accessToken);
    }
};

exports = module.exports = OAuth2Middleware;