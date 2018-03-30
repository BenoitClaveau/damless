/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError } = require("oups");

class HttpRouteLoader {
    constructor(http, fs, config) {
        if (!http) throw new UndefinedError("http");
        if (!fs) throw new UndefinedError("fs");
        if (!config) throw new UndefinedError("config");
        this.http = http;
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
            route.get && await this.http.get(route.get, route.service, route.method, options);
            route.post && await this.http.post(route.post, route.service, route.method, options);
            route.put && await this.http.put(route.put, route.service, route.method, options);
            route.patch && await this.http.patch(route.patch, route.service, route.method, options);
            route.delete && await this.http.delete(route.delete, route.service, route.method, options);
        }
    };
};

exports = module.exports = HttpRouteLoader;
