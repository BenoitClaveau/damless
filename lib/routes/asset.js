/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    UndefinedError, 
    Error 
} = require("oups");
const Get = require("./get");
const Vinyl = require('vinyl');
const fs = require("fs");
const { getBuffer } = require("../core");


const needAttachment = (contentType) => {
	return ["application/vnd.android.package-archive",
             "application/vnd.apple.installer+xml",
            ].some(e => e == contentType);
}

class Asset extends Get {
    constructor(giveme, route) {
        super(giveme, route);
        this.file = null;
        this.options = {};
    };

    async init(filepath, options) {
        if (!filepath) throw new UndefinedError("filepath");
        this.options = {
            ...this.options,
            ...options
        };


        const buffer = await getBuffer(fs.createReadStream(filepath));
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = await this.giveme.resolve("content-type");
        try {
            this.contentType = contentType.get(this.file.extname);
        }
        catch(error) {
            throw new Error("Failed to determinate the content type of ${path}.", { path: this.file.path }, error)
        }
    }

    async invoke (context, stream, headers) {
        const { 
            giveme, 
        } = context;

        const { 
            contentType, 
            options: { 
                auth
            }, 
            file 
        } = this;

        if (auth) {
            const authService = await giveme.resolve("auth");
            await authService.authenticate(context, stream, headers);
        }

        let responseHeaders = {
            ...headers,
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        }

        if (file && needAttachment(contentType))
            responseHeaders["Content-Disposition"] = `attachment; filename="${file.basename}"`;
        
        stream.respond(responseHeaders);
        
        if (!file) throw new Error("Asset for ${route} has not been initialized.", { route: this.route });
        else if (file.isStream()) file.pipe(stream);
        else stream.end(file.contents);
    }
};

exports = module.exports = Asset;
