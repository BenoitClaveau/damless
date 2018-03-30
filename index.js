/*!
 * dam-less
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

'use strict';

const GiveMeTheService = require('givemetheservice');

module.exports = (options) => {
    const giveme = new GiveMeTheService(options);
    giveme.inject("dam-less", `${__diranme}/lib/dam-less`);
    await giveme.load();
    return giveme;
}
module.exports.AuthJwtToken = require('./lib/services/auth-jwt-token');