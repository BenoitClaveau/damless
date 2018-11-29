/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

// https://github.com/oauthjs/node-oauth2-server/blob/master/lib/handlers/token-handler.js

const {
    UndefinedError,
    HttpError,
    Error
} = require("oups");
const { Transform } = require("stream");

class OAuth2Service {

    constructor(config) {
        if (!config) throw new UndefinedError("config");
        this.config = config;
        this.grantTypes = []
    };

    authenticate() {

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
                    if(!chunk.grant_type) return callback(new Error("Missing parameter: `grant_type`"));
                    if(!grantTypes.some(e => e == chunk.grant_type)) return callback(new Error("Unsupported grant type: `grant_type` is invalid"));

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

exports = module.exports = OAuth2Service;