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
            if ("middleware" in file) return file.middleware;
        }
        if (typeof this.config.services == "object") {
            if ("middleware" in this.config.services) return this.config.services.middleware;
        }
        if ("middleware" in this.config) {
            if (typeof this.config.middleware == "string")
                return await this.fs.loadSync(this.config.middleware);
                
            if (typeof this.config.middleware == "object")
                return this.config.middleware;
        }
        return [];
    }
    
    //Do not use mount, need to be call manualy.
    async load() {        
        const middlewares = await this.descriptions();
        for (let middleware of middlewares) {
            this.middleware.push(middleware.name);
        }
    };
};

exports = module.exports = MiddlewaresLoader;
