/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    UndefinedError,
    HttpError,
    Error
} = require("oups");
const jwt = require("jwt-simple");

class AuthJWT {

    constructor(config) {
        this.config = config;
    };

    async invoke(context, stream, headers) {
        try {
            if (context.method == "OPTIONS") return;
            const payload = this.decodeAuthorization(headers.authorization);
            if (!payload) throw new UndefinedError("Payload");
            context.auth = context.auth || {};
            context.auth.payload = payload;
        }
        catch (error) {
            if (/false/.test(context.route.options.auth)) return;
            throw new HttpError(401, "Authentication has failed for ${context.method}:${context.url}.", { context, headers } , error);
        }
    };

    encode(payload, secret) {
        if (!secret) {
            if (this?.config?.http?.jwt?.secret) secret = this.config.http.jwt.secret;
            else if (this?.config?.https?.jwt?.secret) secret = this.config.https.jwt.secret;
        }
        if (!secret) throw new UndefinedError("Secret");
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.encode(payload, buffer);
    };

    decode(token, secret) {
        if (!secret) {
            if (this?.config?.http?.jwt?.secret) secret = this.config.http.jwt.secret;
            else if (this?.config?.https?.jwt?.secret) secret = this.config.https.jwt.secret;
        }
        if (!secret) throw new UndefinedError("Secret");
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.decode(token, buffer);
    };

    decodeAuthorization(authorization) {
        if (!authorization || /^null$/i.test(authorization) || /^undefined$/i.test(authorization)) throw new UndefinedError("authorization");
        const m = /(^Bearer\s)(\S*)/g.exec(authorization);
        if (!m || m.length != 3) throw new Error("Bearer token is invalid.", { authorization });
        return this.decode(m[2]);
    };
};

exports = module.exports = AuthJWT;