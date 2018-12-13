/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class Cors {

    constructor() {
    };

    async invoke(context, stream, headers) {
        stream.respond({
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "*",
            "access-control-max-age": "3600",
            "access-control-allow-headers": "content-type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
        });
    };

};

exports = module.exports = Cors;