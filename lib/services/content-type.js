/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { Error } = require("oups");

class ContentTypeProvider {
    constructor() {
    };
    
    get(ext) {
        switch (ext) {
            case ".json": return "application/json";
            case ".png": return "image/png";
            case ".jpg": return "image/jpg";
            case ".gif": return "image/gif";
            case ".svg": return "image/svg+xml";
            case ".js": return "application/javascript";
            case ".html": return "text/html";
            case ".css": return "text/css";
            case ".ico": return "image/x-icon";
            case ".ttf": return "application/x-font-ttf";
            case ".eot": return "application/vnd.ms-fontobject";
            case ".woff": return "application/font-woff";
            case ".appcache": return "text/cache-manifest";
            case ".txt": return "text/html";
            case ".xml": return "application/xml";
            case ".map": return "application/json";
            case ".md": return "text/x-markdown";
            case ".apk": return "application/vnd.android.package-archive";
            case ".ipa": return "application/octet-stream";
            case ".csv":
            case ".xls":
            case ".xlt":
            case ".xla":
            case ".xlsx":
            case ".xlsm":
            case ".xlst": return "application/vnd.ms-excel";
            case ".doc": 
            case ".docx": 
            case ".doct": 
            case ".docm": return "application/vnd.ms-word";
            case ".ppt":
            case ".pot":
            case ".pps":
            case ".ppa":
            case ".pptx":
            case ".potx":
            case ".ppsx":
            case ".ppam":
            case ".pptm":
            case ".potm":
            case ".ppsm": return "vnd.ms-powerpoint";
            case ".mp4": return "video/mp4";
            case ".webm": return "video/webm";
            case ".ogv": return "video/ogg";
            case ".aac": return "audio/aac";
            case ".mp3":
            case ".mpeg": return "audio/mpeg";
            case ".oga":
            case ".ogg": return "audio/ogg";
            case ".wav": return "audio/wav";
            case "":
                throw new Error(`Empty extension is not supported.`);
            default: 
                throw new Error(`Extension ${extension} is not supported.`, { extension: ext });
        };
    };
};

exports = module.exports = ContentTypeProvider;