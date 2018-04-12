/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    UndefinedError, 
    Error 
} = require("oups");
const Get = require("./get");
const Vinyl = require('vinyl');
const zlib = require("zlib");
const fs = require("fs");
const StreamToBuffer = require("../utils/stream-to-buffer");

class Asset extends Get {
    constructor(giveme, route) {
        super(giveme, route);
        this.file = null;
        this.options = {};
    };

    async init(filepath, options) {
        if (!filepath) throw new UndefinedError("filepath");
        this.options = { ...this.options, ...options };

        const buffer = await fs.createReadStream(filepath).pipe(new StreamToBuffer());
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = await this.giveme.resolve("content-type");
        try {
            this.contentType = contentType.get(this.file.extname);
        }
        catch(error) {
            throw new Error("Failed to determinate the content type of ${file.path}.", { file: this.file }, error)
        }
    }

    async invoke (context, stream, headers) {
        const { 
            method, 
            giveme, 
            route: { 
                options: { 
                    auth 
                }
            }
        } = context;

        const { 
            contentType, 
            options: { 
                auth: auth2 
            }, 
            file 
        } = this;

        if (auth || auth2) {
            const auth = await giveme.resolve("auth");
            await auth.authenticate(context, stream, headers);
        }
        
        stream.respond({ 
            ...headers,
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        });
        
        if (file.isStream()) file.pipe(stream);
        else stream.end(file.contents);
    }
};

exports = module.exports = Asset;
