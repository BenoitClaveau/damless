/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class MiddlewaresLoader {
    constructor(fs, config, middleware) {
        this.fs = fs;
        this.config = config;
        this.middleware = middleware;
    };
    
    async descriptions() {
        if (typeof this.config.services == "string") {
            const file = await this.fs.loadSync(this.config.services);
            if (!file) return [];
            if ("middlewares" in file) return file.middlewares;
        }
        if (typeof this.config.services == "object") {
            if ("middlewares" in this.config.services) return this.config.services.middlewares;
        }
        if ("middlewares" in this.config) {
            if (typeof this.config.middleware == "string")
                return await this.fs.loadSync(this.config.middlewares);
                
            if (typeof this.config.middlewares == "object")
                return this.config.middlewares;
        }
        return [];
    }
    
    // Do not use mount, need to be call manualy.
    async load() {        
        const middlewares = await this.descriptions();
        for (let middleware of middlewares) {
            this.middleware.push(middleware);
        }
    };
};

exports = module.exports = MiddlewaresLoader;
