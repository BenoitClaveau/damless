/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
class HttpRoutesLoader {
    constructor(httpServer, fs, config) {
        this.httpServer = httpServer;
        this.fs = fs;
        this.config = config;
    };
    
    async descriptions() {
        if (typeof this.config.services == "string") {
            const file = await this.fs.loadSync(this.config.services);
            if (!file) return [];
            if ("http-routes" in file) return file["http-routes"];
        }
        if (typeof this.config.services == "object") {
            if ("http-routes" in this.config.services) return this.config.services["http-routes"];
        }
        if ("http-routes" in this.config) {
            if (typeof this.config["http-routes"] == "string")
                return await this.fs.loadSync(this.config["http-routes"]);
                
            if (typeof this.config["http-routes"] == "object")
                return this.config["http-routes"];
        }
        return [];
    }
    
    //Do not use mount, need to be call manualy.
    async load() {        
        const routes = await this.descriptions();
        for (let route of routes) {
            const { get, post, put, patch, method, ['delete']: deleteM , service, ...options } = route;
            options.auth = options.auth ?? true;
            get && await this.httpServer.get(get, service, method, options);
            post && await this.httpServer.post(post, service, method, options);
            put && await this.httpServer.put(put, service, method, options);
            patch && await this.httpServer.patch(patch, service, method, options);
            deleteM && await this.httpServer.delete(deleteM, service, method, options);
        }
    };
};

exports = module.exports = HttpRoutesLoader;
