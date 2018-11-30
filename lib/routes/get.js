/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Error } = require("oups");

class Get {
    constructor(giveme, route) {
        this.giveme = giveme;
        this.route = route;
        this.contentType = null;
        this.serviceName = null;
        this.methodName = null;
        this.method = null;
        this.options = {};
    };

    async init(serviceName, methodName, options = {}) {
        this.options = {
            ...this.options,
            ...options
        };
        if (!serviceName) throw new Error("Service for ${route} is not defined.", { route: this.route });
        if (!methodName) throw new Error("Method for ${route} not defined.", { route: this.route });
        if (typeof serviceName !== "string") throw new Error("Service for ${route} is not a string.", { route: this.route });
        if (typeof methodName !== "string") throw new Error("Method for ${route} is not a string.", { route: this.route });
        
        this.middleware = await this.giveme.resolve("middleware");

        this.serviceName = serviceName;
        this.service = await this.giveme.resolve(this.serviceName);
        if (!this.service)
            throw new Error("${serviceName} for ${route} is not defined.", { serviceName: this.serviceName, route: this.route });

        this.methodName = methodName;
        this.method = this.service[this.methodName];
        if (!this.method)
            throw new Error("${methodName} in ${serviceName} for ${route} is not defined.", { serviceName: this.serviceName, methodName: this.methodName, route: this.route });
    };

    async invoke(context, stream, headers, flags) {
        const {
            route: {
                service,
                method: fn
            }
        } = context;

        const handeled = await this.middleware.invoke(context, stream, headers);
        if (handeled) return;

        if (!fn) throw new Error("${methodName} in ${serviceName} for ${route} has not been initialized.", { serviceName: this.serviceName, methodName: this.methodName, route: this.route });
        return await fn.call(service, context, stream, headers, flags);
    };
};

exports = module.exports = Get;
