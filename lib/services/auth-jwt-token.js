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

class AuthenticationService {

    constructor(config) {
        if (!config) throw new UndefinedError("config");
        this.config = config;
    };

    async authenticate(context, stream, headers) {
        try {
            const payload = this.decodeAuthorization(headers.authorization);
            if (!payload) throw new UndefinedError("Payload");
            context.auth = context.auth || {};
            context.auth.payload = payload;
        }
        catch (error) {
            throw new HttpError(401, "Authentication has failed for ${context.method}:${context.url}.", { context, stream, headers } , error);
        }
    };

    encode(payload, secret = this.config.http.jwt.secret) {
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.encode(payload, buffer);
    };

    decode(token, secret = this.config.http.jwt.secret) {
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.decode(token, buffer);
    };

    decodeAuthorization(authorization) {
        if (!authorization || /^null$/i.test(authorization) || /^undefined$/i.test(authorization)) throw new UndefinedError("Authorization");
        const m = /(^Bearer\s)(\S*)/g.exec(authorization);
        if (!m || m.length != 3) throw new Error("Bearer token is invalid.", { authorization });
        return this.decode(m[2]);
    };
};

exports = module.exports = AuthenticationService;