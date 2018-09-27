/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Error } = require("oups");

class ContentTypeProvider {
    constructor() {
    };
    
    get(ext) {
         //https://developer.mozilla.org/fr/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
        switch (ext) {
            case ".json": return "application/json";
            case ".png": return "image/png";
            case ".jpeg":
            case ".jpg": return "image/jpeg";
            case ".gif": return "image/gif";
            case ".svg": return "image/svg+xml";
            case ".tiff": 
            case ".tif": return "image/tiff";
            case ".js": return "application/javascript";
            case ".html":
            case ".htm": return "text/html";
            case ".xhtml": return "application/xhtml+xml";
            case ".css": return "text/css";
            case ".ico": return "image/x-icon";
            case ".ttf": return "application/x-font-ttf";
            case ".otf": return "application/x-font-opentype";
            case ".eot": return "application/vnd.ms-fontobject";
            case ".woff": return "application/font-woff";
            case ".woff2": return "application/font-woff2";
            case ".sfnt": return "application/font-sfnt";
            case ".appcache": return "text/cache-manifest";
            case ".txt": return "text/html";
            case ".xml": return "application/xml";
            case ".map": return "application/json";
            case ".md": return "text/x-markdown";
            case "pdf": return "application/pdf";
            case ".csv": return "text/csv";
            case ".ics": return "text/calendar";
            case ".xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case ".xltx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.template";
            case ".xlsm": return "application/vnd.ms-excel.sheet.macroEnabled.12";
            case ".xltm": return "application/vnd.ms-excel.template.macroEnabled.12";
            case ".xlam": return "application/vnd.ms-excel.addin.macroEnabled.12";
            case ".xlsb": return "application/vnd.ms-excel.sheet.binary.macroEnabled.12";
            case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".dotx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.template";
            case ".docm": return "application/vnd.ms-word.document.macroEnabled.12";
            case ".dotm": return "application/vnd.ms-word.template.macroEnabled.12";
            case ".pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case ".potx": return "application/vnd.openxmlformats-officedocument.presentationml.template";
            case ".ppsx": return "application/vnd.openxmlformats-officedocument.presentationml.slideshow";
            case ".ppam": return "application/vnd.ms-powerpoint.addin.macroEnabled.12";
            case ".pptm": return "application/vnd.ms-powerpoint.presentation.macroEnabled.12";
            case ".potm": return "application/vnd.ms-powerpoint.template.macroEnabled.12";
            case ".ppsm": return "application/vnd.ms-powerpoint.slideshow.macroEnabled.12";
            case ".xls":
            case ".xlt":
            case ".xla": return "application/vnd.ms-excel";
            case ".doc": 
            case ".dot": return "application/msword";
            case ".doct": 
            case ".docm": return "application/vnd.ms-word";
            case ".ppt":
            case ".pot":
            case ".pps":
            case ".ppa":  return "application/vnd.ms-powerpoint";
            case ".odp": return "application/vnd.oasis.opendocument.presentation";
            case ".ods": return "application/vnd.oasis.opendocument.spreadsheet";
            case ".odt": return "application/vnd.oasis.opendocument.text";
            case ".mp4": return "video/mp4";
            case ".webm": return "video/webm";
            case ".weba": return "audio/webm";
            case ".ogv": return "video/ogg";
            case ".aac": return "audio/aac";
            case ".mp3":
            case ".mpg":
            case ".mpeg": return "audio/mpeg";
            case ".avi": return "video/x-msvideo";
            case ".oga":
            case ".ogv":
            case ".ogg": return "audio/ogg";
            case ".ogx": return "application/ogg";
            case ".wav": return "audio/wav";
            case ".midi":
            case ".mid": return "audio/midi";
            case ".3gp": return "video/3gpp";
            case ".3g2": return "video/3gpp2";
            case ".bin":
            case ".ipa": 
            case ".arc": return "application/octet-stream";
            case ".apk": return "application/vnd.android.package-archive";
            case ".mpkg": return "application/vnd.apple.installer+xml";
            case ".epub": return "application/epub+zip";
            case ".jar": return "application/java-archive";
            case ".zip": return "application/zip";
            case ".tar": return "application/x-tar";
            case ".bz": return "application/x-bzip";
            case ".bz2": return "application/x-bzip2";
            case ".7z": return "application/x-7z-compressed";
            case ".rar": return "application/x-rar-compressed";
            case ".sh": return "application/x-sh";
            case ".csh": return "application/x-csh";
            case ".rtf": return "application/rtf";
            case ".xul": return "application/vnd.mozilla.xul+xml";
            case ".vsd": return "application/vnd.visio";
            case ".azw": return "application/vnd.amazon.ebook";
            case ".abw": return "application/x-abiword";
            case ".swf": return "application/x-shockwave-flash";
            case "":
            case undefined:
                throw new Error(`Empty extension is not supported.`);
            default: 
                throw new Error(`Extension ${extension} is not supported.`, { extension: ext });
        };
    };
};

exports = module.exports = ContentTypeProvider;