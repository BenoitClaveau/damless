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

class Asset extends Get {
    constructor(giveme, route) {
        super(giveme, route);
        this.file = null;
        this.options = {};
        this.headers = {
            "Cache-Control": "no-cache"
        };
    };

    async getContentType() {
        const contentTypeResolver = await this.giveme.resolve("content-type");
        try {
           return contentTypeResolver.get(this.file.extname);
        }
        catch(error) {
            throw new Error("Failed to determinate the content type of ${path}.", { path: this.file.path }, error)
        }
    }

    async init(filepath, options = {}, headers = {}) {
        if (!filepath) throw new UndefinedError("filepath");
        
        this.options = {
            ...this.options,
            ...options
        };

        this.headers = {
            ...this.headers,
            ...headers
        };
        
        this.middleware = await this.giveme.resolve("middleware");
    
        const buffer = await getBuffer(fs.createReadStream(filepath));
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = this.headers["Content-Type"] = this.headers["Content-Type"] || await this.getContentType();

        switch(contentType) {
            case "application/json":
                this.options.mode = "object";
                break;
            case "application/vnd.android.package-archive":
            case "application/vnd.apple.installer+xml":
                this.headers["Content-Disposition"] = `attachment; filename="${this.file.basename}"`;
                break;
        }
    }

    async invoke (context, stream, headers) {

        const { 
            file,
            options: {
                mode
            }
        } = this;

        const handeled = await this.middleware.invoke(context, stream, headers);
        if (handeled) return;

        if (mode) stream.mode(mode);
        stream.respond({
            ...this.headers,
            ...headers
        });
        
        if (!file) throw new Error("Asset for ${route} has not been initialized.", { route: this.route });
        else if (file.isStream()) file.pipe(stream);
        else stream.end(file.contents);
    }
};

exports = module.exports = Asset;
