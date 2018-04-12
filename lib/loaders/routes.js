/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
const { UndefinedError } = require("oups");

class HttpRouteLoader {
    constructor(httpRouter, fs, config) {
        if (!httpRouter) throw new UndefinedError("httpRouter");
        if (!fs) throw new UndefinedError("fs");
        if (!config) throw new UndefinedError("config");
        this.httpRouter = httpRouter;
        this.fs = fs;
        this.config = config;

    };
    
    //Do not use mount, need to be call manualy.
    async load() {
        const file = await this.fs.loadSync(this.config.services);
        if (!file) return;
        const routes = file["http-routes"];
        if (!routes) return;
        for (let route of routes) {
            let { auth, forward } = route;
            auth = /false/i.test(auth) == false;
            const options = { auth, forward };
            route.get && await this.httpRouter.get(route.get, route.service, route.method, options);
            route.post && await this.httpRouter.post(route.post, route.service, route.method, options);
            route.put && await this.httpRouter.put(route.put, route.service, route.method, options);
            route.patch && await this.httpRouter.patch(route.patch, route.service, route.method, options);
            route.delete && await this.httpRouter.delete(route.delete, route.service, route.method, options);
        }
    };
};

exports = module.exports = HttpRouteLoader;
