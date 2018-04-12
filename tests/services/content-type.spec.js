/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const ContentType = new require('../../lib/services/content-type');
const process = require("process");
const { inspect } = require("util");

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', inspect(reason));
});

describe("ContentType", () => {

    const contentType = new ContentType();

    it("get", () => {
        expect(contentType.get(".json")).to.be("application/json");
        expect(contentType.get(".png")).to.be("image/png");
        expect(contentType.get(".jpg")).to.be("image/jpg");
        expect(contentType.get(".gif")).to.be("image/gif");
        expect(contentType.get(".svg")).to.be("image/svg+xml");
        expect(contentType.get(".js")).to.be("application/javascript");
        expect(contentType.get(".html")).to.be("text/html");
        expect(contentType.get(".css")).to.be("text/css");
        expect(contentType.get(".ico")).to.be("image/x-icon");
        expect(contentType.get(".ttf")).to.be("application/x-font-ttf");
        expect(contentType.get(".eot")).to.be("application/vnd.ms-fontobject");
        expect(contentType.get(".woff")).to.be("application/font-woff");
        expect(contentType.get(".appcache")).to.be("text/cache-manifest");
        expect(contentType.get(".map")).to.be("application/json");
        expect(contentType.get(".md")).to.be("text/x-markdown");
    });
});