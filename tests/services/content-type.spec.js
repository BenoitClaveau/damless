/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const ContentType = new require('../../lib/services/content-type.js');
const process = require("process");
const { inspect } = require("util");

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', inspect(reason));
});

describe("ContentType", () => {

    const contentType = new ContentType();

    it("get", () => {
        expect(contentType.get(".json")).to.be("application/json");
        expect(contentType.get(".geojson")).to.be("application/json");
        expect(contentType.get(".png")).to.be("image/png");
        expect(contentType.get(".jpeg")).to.be("image/jpeg");
        expect(contentType.get(".jpg")).to.be("image/jpeg");
        expect(contentType.get(".gif")).to.be("image/gif");
        expect(contentType.get(".svg")).to.be("image/svg+xml");
        expect(contentType.get(".tiff")).to.be("image/tiff");
        expect(contentType.get(".tif")).to.be("image/tiff");
        expect(contentType.get(".js")).to.be("application/javascript");
        expect(contentType.get(".html")).to.be("text/html");
        expect(contentType.get(".htm")).to.be("text/html");
        expect(contentType.get(".xhtml")).to.be("application/xhtml+xml");
        expect(contentType.get(".css")).to.be("text/css");
        expect(contentType.get(".ico")).to.be("image/x-icon");
        expect(contentType.get(".ttf")).to.be("application/x-font-ttf");
        expect(contentType.get(".otf")).to.be("application/x-font-opentype");
        expect(contentType.get(".eot")).to.be("application/vnd.ms-fontobject");
        expect(contentType.get(".woff")).to.be("application/font-woff");
        expect(contentType.get(".woff2")).to.be("application/font-woff2");
        expect(contentType.get(".sfnt")).to.be("application/font-sfnt");
        expect(contentType.get(".appcache")).to.be("text/cache-manifest");
        expect(contentType.get(".txt")).to.be("text/html");
        expect(contentType.get(".xml")).to.be("application/xml");
        expect(contentType.get(".map")).to.be("application/json");
        expect(contentType.get(".md")).to.be("text/x-markdown");
        expect(contentType.get(".pdf")).to.be("application/pdf");
        expect(contentType.get(".csv")).to.be("text/csv");
        expect(contentType.get(".ics")).to.be("text/calendar");
        expect(contentType.get(".xlsx")).to.be("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(contentType.get(".xltx")).to.be("application/vnd.openxmlformats-officedocument.spreadsheetml.template");
        expect(contentType.get(".xlsm")).to.be("application/vnd.ms-excel.sheet.macroEnabled.12");
        expect(contentType.get(".xltm")).to.be("application/vnd.ms-excel.template.macroEnabled.12");
        expect(contentType.get(".xlam")).to.be("application/vnd.ms-excel.addin.macroEnabled.12");
        expect(contentType.get(".xlsb")).to.be("application/vnd.ms-excel.sheet.binary.macroEnabled.12");
        expect(contentType.get(".docx")).to.be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        expect(contentType.get(".dotx")).to.be("application/vnd.openxmlformats-officedocument.wordprocessingml.template");
        expect(contentType.get(".docm")).to.be("application/vnd.ms-word.document.macroEnabled.12");
        expect(contentType.get(".dotm")).to.be("application/vnd.ms-word.template.macroEnabled.12");
        expect(contentType.get(".pptx")).to.be("application/vnd.openxmlformats-officedocument.presentationml.presentation");
        expect(contentType.get(".potx")).to.be("application/vnd.openxmlformats-officedocument.presentationml.template");
        expect(contentType.get(".ppsx")).to.be("application/vnd.openxmlformats-officedocument.presentationml.slideshow");
        expect(contentType.get(".ppam")).to.be("application/vnd.ms-powerpoint.addin.macroEnabled.12");
        expect(contentType.get(".pptm")).to.be("application/vnd.ms-powerpoint.presentation.macroEnabled.12");
        expect(contentType.get(".potm")).to.be("application/vnd.ms-powerpoint.template.macroEnabled.12");
        expect(contentType.get(".ppsm")).to.be("application/vnd.ms-powerpoint.slideshow.macroEnabled.12");
        expect(contentType.get(".xls")).to.be("application/vnd.ms-excel");
        expect(contentType.get(".xlt")).to.be("application/vnd.ms-excel");
        expect(contentType.get(".xla")).to.be("application/vnd.ms-excel");
        expect(contentType.get(".doc")).to.be("application/msword");
        expect(contentType.get(".dot")).to.be("application/msword");
        expect(contentType.get(".ppt")).to.be("application/vnd.ms-powerpoint");
        expect(contentType.get(".pot")).to.be("application/vnd.ms-powerpoint");
        expect(contentType.get(".pps")).to.be("application/vnd.ms-powerpoint");
        expect(contentType.get(".ppa")).to.be("application/vnd.ms-powerpoint");
        expect(contentType.get(".odp")).to.be("application/vnd.oasis.opendocument.presentation");
        expect(contentType.get(".ods")).to.be("application/vnd.oasis.opendocument.spreadsheet");
        expect(contentType.get(".odt")).to.be("application/vnd.oasis.opendocument.text");
        expect(contentType.get(".mp4")).to.be("video/mp4");
        expect(contentType.get(".webm")).to.be("video/webm");
        expect(contentType.get(".weba")).to.be("audio/webm");
        expect(contentType.get(".ogv")).to.be("video/ogg");
        expect(contentType.get(".aac")).to.be("audio/aac");
        expect(contentType.get(".mp3")).to.be("audio/mpeg");
        expect(contentType.get(".mpg")).to.be("audio/mpeg");
        expect(contentType.get(".mpeg")).to.be("audio/mpeg");
        expect(contentType.get(".avi")).to.be("video/x-msvideo");
        expect(contentType.get(".oga")).to.be("audio/ogg");
        expect(contentType.get(".ogg")).to.be("audio/ogg");
        expect(contentType.get(".ogx")).to.be("application/ogg");
        expect(contentType.get(".wav")).to.be("audio/wav");
        expect(contentType.get(".midi")).to.be("audio/midi");
        expect(contentType.get(".mid")).to.be("audio/midi");
        expect(contentType.get(".3gp")).to.be("video/3gpp");
        expect(contentType.get(".3g2")).to.be("video/3gpp2");
        expect(contentType.get(".bin")).to.be("application/octet-stream");
        expect(contentType.get(".ipa")).to.be("application/octet-stream");
        expect(contentType.get(".arc")).to.be("application/octet-stream");
        expect(contentType.get(".apk")).to.be("application/vnd.android.package-archive");
        expect(contentType.get(".mpkg")).to.be("application/vnd.apple.installer+xml");
        expect(contentType.get(".epub")).to.be("application/epub+zip");
        expect(contentType.get(".jar")).to.be("application/java-archive");
        expect(contentType.get(".zip")).to.be("application/zip");
        expect(contentType.get(".tar")).to.be("application/x-tar");
        expect(contentType.get(".bz")).to.be("application/x-bzip");
        expect(contentType.get(".bz2")).to.be("application/x-bzip2");
        expect(contentType.get(".7z")).to.be("application/x-7z-compressed");
        expect(contentType.get(".rar")).to.be("application/x-rar-compressed");
        expect(contentType.get(".sh")).to.be("application/x-sh");
        expect(contentType.get(".csh")).to.be("application/x-csh");
        expect(contentType.get(".rtf")).to.be("application/rtf");
        expect(contentType.get(".xul")).to.be("application/vnd.mozilla.xul+xml");
        expect(contentType.get(".vsd")).to.be("application/vnd.visio");
        expect(contentType.get(".azw")).to.be("application/vnd.amazon.ebook");
        expect(contentType.get(".abw")).to.be("application/x-abiword");
        expect(contentType.get(".swf")).to.be("application/x-shockwave-flash");
    });

    it("unsupported extension", () => {
        try {
            contentType.get(".toto");
        }
        catch(error) {
            expect(error.message).to.be("Extension \".toto\" is not supported.");
        }
    })
});