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
const { Transform } = require("stream");
const { ending } = require("../../../index");

class OAuth2Middleware {

    constructor(config) {
        this.config = config;
        this.grantTypes = []
    };

    async getTokenFromRequest(context, stream, headers) {
        const headerToken = headers.authorization;

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

        // if (!!headerToken + !!queryToken + !!bodyToken > 1) throw new Error("Only one authentication method is allowed.");

        if (headerToken) {
            const m = headerToken.match(/Bearer\s(\S+)/);
            if (!m) throw new Error("Malformed authorization header.");
            return m[1];
        }
    }

    /* must be overridden */
    getAccessToken(token) {
        var tokenExpires = new Date();
        tokenExpires.setDate(tokenExpires.getDate() + 1);

        return {
            user: {}, // Rechercher en fonction to token ?
            accessTokenExpiresAt: tokenExpires 
        };
    }

    validateAccessToken(accessToken) {
        if (!accessToken.accessTokenExpiresAt instanceof Date) throw new Error("`accessTokenExpiresAt` must be a Date instance.");
        if (accessToken.accessTokenExpiresAt < new Date()) throw new HttpError(401, "access token has expired.");
    }

    async invoke(context, stream, headers) {
        const token = await this.getTokenFromRequest(context, stream, headers);
        const accessToken = this.getAccessToken(token);
        this.validateAccessToken(accessToken);
    }

    /**
     * /oauth/token
     */
    token(context, stream, headers) {


        const { method } = context;
        if (method !== "POST") throw new Error("Request method must be POST");
        //if ("application/x-www-form-urlencoded') throw new Error("Request content must be application/x-www-form-urlencoded");

        //const client = await this.getClient();

        //response.set('Cache-Control', 'no-store');
        //response.set('Pragma', 'no-cache');

        stream
            .pipe(new Transform({
                objectMode: true,
                transform: (chunk, enc, callback) => {
                    if (!chunk.grant_type) return callback(new Error("Missing parameter: `grant_type`"));
                    if (!grantTypes.some(e => e == chunk.grant_type)) return callback(new Error("Unsupported grant type: `grant_type` is invalid"));

                    // TODO allez chercher les valeru via clie,t
                    const accessTokenLifetime = 60 * 60;             // 1 hour.
                    const refreshTokenLifetime = 60 * 60 * 24 * 14;  // 2 weeks.
                    const allowExtendedTokenAttributes = false;


                    callback(null, {
                        access_token: accessTokenLifetime,
                        token_type: 'Bearer',
                        expires_in: chunk.accessTokenLifetime,
                        refresh_token: chunk.refreshTokenLifetime,
                        scope,
                        ...customAttributes && customAttributes
                    });
                }
            }))
            .pipe(stream.respond({
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache'
            }))
    }

    /**
     * /authorise
     */
    authorize() {

    }

};

exports = module.exports = OAuth2Middleware;