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
const { ending } = require("../../../index");

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

class OAuth2Middleware {

    constructor(config) {
        this.config = config;
        this.grantTypes = []
    };

    getTokenFromRequestHeader(context, stream, headers) {
        const headerToken = headers.authorization;

        let m = headerToken.match(/Bearer\s(\S+)/);
        if (m) return new BearerToken(m[1]);
        
        m = headerToken.match(/Basic\s(\S+)/);
        if (m) return new BasicToken(m[1]);

        throw new Error('Unknown token format.');
    }

    getTokenFromRequest(context, stream, headers) {
        const headerToken = headers.authorization;
        const queryToken = context.query.access_token;
        const bodyToken = null; // pas encore géré

        // TODO pour l'instant je ne gére le token que par le header !
        // const queryToken = context.query.access_token;
        // const bodyToken = await ending(
        //     stream
        //         .mode("object")
        //         .pipe(new Transform({
        //             objectMode: true,
        //             transform(chunk, encoding, callback) {
        //                 if (chunk.access_token) callback(null, chunk.access_token);
        //                 else callback(null);
        //             }
        //         }))
        // );

        if (!!headerToken + !!queryToken + !!bodyToken > 1) throw new Error("Only one authentication method is allowed.");

        if (headerToken) return this.getTokenFromRequestHeader(context, stream, headers);
        if (queryToken) return this.getTokenFromRequestQuery(context, stream, headers); // TODO
        if (bodyToken) return this.getTokenFromRequestBody(context, stream, headers);   // TODO
        
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

    /**
     * /oauth/access_token
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
                return chunk;
            }),
            transform((chunk, enc) => {
                // TODO allez chercher les valeru via clie,t
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
            }),
            stream.respond({
                'cache-control': 'no-store',
                'pragma': 'no-cache'
            })
        );
    }

    /**
     * /authorise
     */
    authorize() {

    }

};

exports = module.exports = OAuth2Middleware;