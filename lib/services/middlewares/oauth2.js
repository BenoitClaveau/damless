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
 * 
 * https://www.express-gateway.io/getting-started-with-oauth2/
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

class OAuth2Middleware {

    constructor(config) {
        this.config = config;
        this.grantTypes = [];
    };

    async extract(context, stream, headers) {
        const res = {};
        let body = {};
        
        if (context.method == "POST") {
            await pipelineAsync(
                stream.mode("object"),
                transform((chunk, enc) => {
                    const obj = querystring.parse(chunk.toString());
                    if (!obj) return;
                    body = {
                        ...body,
                        ...obj
                    }
                })
            );
        }

        const fields = { 
            scope: "scope", 
            clientId: "client_id", 
            clientSecret: "client_secret", 
            redirectUri: "redirect_uri",
            responseType: "response_type"
        }

        for (let [key, value] of Object.entries(fields)) {
            if (context.auth && key in context.auth.payload) res[key] = context.auth.payload[key];
            if (value in context.query) res[key] = context.query[value];
            if (value in headers) res[key] = context.headers[value];
            if (value in body) res[key] = body[value];
            
        }
        return res;
    }

    async invoke(context, stream, headers) {
        try {
            if (/false/.test(context.route.options.auth)) return;

            if (!headers.authorization) throw new Error("No authorization header.");

            let m = headers.authorization.match(/Bearer\s(\S+)/);
            if (m) {
                bearerToken = m[1];
                context.auth = {
                    user: {},   // TODO
                    payload: {  // TODO
                    }
                }
            }
            m = headers.authorization.match(/Basic\s(\S+)/);
            if (m) {
                const [clientId, clientSecret] = Buffer.from(m[1], "base64").toString().split(":");
                context.auth = {
                    user: {},   // TODO
                    payload: {
                        clientId,
                        clientSecret
                    }
                }
            }
            
        }
        catch (error) {
            throw new HttpError(401, "Authentication has failed for ${context.method}:${context.url}.", { context, headers }, error);
        }
    }

    // authenticate(headers) {
        

    //     /*
    //     const {
    //         scope,
    //         clientId,
    //         redirectUri,
    //         responseType,
    //         accessTokenExpiresAt
    //     } = await this.extract(context, stream, headers);

    //     // dummy access token
    //     var tokenExpires = new Date();
    //     tokenExpires.setDate(tokenExpires.getDate() + 1);
    //     */

    //     return {
    //         user: { name: clientId },
    //         accessTokenExpiresAt: tokenExpires
    //     };


    //     // const options = {
    //     //     addAcceptedScopesHeader: true,
    //     //     addAuthorizedScopesHeader: true,
    //     //     allowBearerTokensInQueryString: false
    //     // };

    //     //const token = await this.getTokenFromRequest(context, stream, headers);
    //     const accessToken = await this.getAccessToken(token);
    //     this.validateAccessToken(accessToken);
    //     this.validateScope(accessToken);
    //     return accessToken;
    //     // if (scope && this.addAcceptedScopesHeader) response.set('X-Accepted-OAuth-Scopes', this.scope);
    //     // if (scope && this.addAuthorizedScopesHeader) response.set('X-OAuth-Scopes', accessToken.scope);
    //     // context.auth = accessToken;
    // }

    async token(context, stream, headers) {

        const {
            scope,
            clientId,
            redirectUri,
            responseType
        } = await this.extract(context, stream, headers);

        // const options = {
        //     allowEmptyState: false,
        //     authorizationCodeLifetime: 5 * 60   // 5 minutes.
        // }

        const expiresAt = this.getAuthorizationCodeLifetime();
        //const client = this.getClient(clientId, redirectUri);
        //const user = await this.getUser(context, stream, headers);
        //const authorizationCode = this.generateAuthorizationCode(client, user, scope);
        
        const authorizationCode = this.generateAuthorizationCode();

        // en fonction de responsetype la redirection change

        const code = {
            authorizationCode: authorizationCode,
            expiresAt: expiresAt,
            redirectUri: redirectUri,
            scope: scope
        };


        stream.redirect(`${redirectUri}?code=${authorizationCode}`);
    }

    async token2(context, stream, headers) {
        const options = {
            accessTokenLifetime: 60 * 60,             // 1 hour.
            refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
            allowExtendedTokenAttributes: false,
            requireClientAuthentication: {}
        }

        const { method } = context;
        if (method !== "POST") throw new Error("Request method must be POST");

        stream.mode("object");
        await pipelineAsync(
            stream,
            transform((chunk, enc) => {
                return querystring.parse(chunk.toString());
            }),
            transform((chunk, enc) => {
                switch (chunk.grant_type) {
                    case "refresh_token": return this.generateRefreshToken();
                    //case "authorization_code": return this.generateAuthorizationCode();
                    default: throw new Error("Missing parameter: `grant_type`");
                }

            }),
            stream.respond({
                'cache-control': 'no-store',
                'pragma': 'no-cache'
            })
        );

    }


    getTokenFromRequest(context, stream, headers) {

        // header
        // const headerToken = headers.authorization;
        // if (headerToken) return TokenFactory.create(headerToken);

        // const queryToken = context.query.access_token;
        // if (queryToken) return TokenFactory.create(queryToken);

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



    getAuthorizationCodeLifetime() {
        const authorizationCodeLifetime = 5 * 60   // 5 minutes. //config

        var expires = new Date();
        expires.setSeconds(expires.getSeconds() + authorizationCodeLifetime);
        return expires;
    }

    getClient(clientId, redirectUri) {
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

    // async getUser(headers) {
    //     const accessToken = await this.authenticate(headers);
    //     return accessToken.user;
    // }

    generateAuthorizationCode() {
        const buffer = crypto.randomBytes(256);
        return crypto
            .createHash('sha1')
            .update(buffer)
            .digest('hex');
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