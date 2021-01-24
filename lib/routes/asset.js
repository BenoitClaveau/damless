/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    UndefinedError, 
    Error 
} = require("oups");
const path = require("path");
const Get = require("./get");
const Vinyl = require('vinyl');
const fs = require("fs");
const { getBuffer } = require("../streams");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

class Asset extends Get {
    constructor(giveme, route) {
        super(giveme, route);
        this.file = null;
        this.options = {};
        this.headers = {
            "cache-control": "no-cache"
        };
    };

    async getContentType() {
        const contentTypeResolver = await this.giveme.resolve("content-type");
        try {
            if (!this.file.extname) {
                const filename = path.basename(this.file.path);
                if (/LICENSE/ig.test(filename)) return contentTypeResolver.get(".txt");
            }
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
        
        const buffer = await getBuffer(fs.createReadStream(filepath));
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = this.headers["content-type"] = this.headers["content-type"] || await this.getContentType();

        switch(contentType) {
            case "application/json":
                this.options.mode = "object";
                break;
            case "application/vnd.android.package-archive":
            case "application/vnd.apple.installer+xml":
                this.headers["content-disposition"] = `attachment; filename="${this.file.basename}"`;
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
        
        if (mode) stream.mode(mode);
        stream.respond({
            statusCode: 200,
            ...this.headers
        });
        
        if (!file) throw new Error("Asset for ${route} has not been initialized.", { route: this.route });
        else if (file.isStream())
            await pipeline(
                file, 
                stream
            );
        else
            stream.end(file.contents);
    }
};

exports = module.exports = Asset;
