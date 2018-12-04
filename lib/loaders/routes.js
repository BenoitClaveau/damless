/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
const { UndefinedError } = require("oups");

class HttpRoutesLoader {
    constructor(httpServer, fs, config) {
        if (!httpServer) throw new UndefinedError("damless");
        if (!fs) throw new UndefinedError("fs");
        if (!config) throw new UndefinedError("config");
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
            let { auth, forward } = route;
            auth = /false/i.test(auth) == false;
            const options = { auth, forward };
            route.get && await this.httpServer.get(route.get, route.service, route.method, options);
            route.post && await this.httpServer.post(route.post, route.service, route.method, options);
            route.put && await this.httpServer.put(route.put, route.service, route.method, options);
            route.patch && await this.httpServer.patch(route.patch, route.service, route.method, options);
            route.delete && await this.httpServer.delete(route.delete, route.service, route.method, options);
        }
    };
};

exports = module.exports = HttpRoutesLoader;
