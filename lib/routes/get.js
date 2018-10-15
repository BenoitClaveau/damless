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

        if (this.options.forward) return;

        if (!serviceName) throw new Error("Service for ${route} is not defined.", { route: this.route });
        if (!methodName) throw new Error("Method for ${route} not defined.", { route: this.route });
        if (typeof serviceName !== "string") throw new Error("Service for ${route} is not a string.", { route: this.route });
        if (typeof methodName !== "string") throw new Error("Method for ${route} is not a string.", { route: this.route });

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
                options: {
                    auth,
                    forward
                },
                service,
                method: fn
            }
        } = context;

        if (forward) {
            if (forward.asset) {
                const isitasset = await giveme.resolve("isitasset");
                const asset = await isitasset.ask(forward.asset);
                const asset = await this.isitasset.ask(forward.asset);
                return await asset.router.invoke(context, stream, headers);
            }
            else throw new Error("NotSupported");
        }

        if (auth) {
            const auth = await giveme.resolve("auth");
            await auth.authenticate(context, stream, headers);
        }

        if (!fn) throw new Error("${methodName} in ${serviceName} for ${route} has not been initialized.", { serviceName: this.serviceName, methodName: this.methodName, route: this.route });

        const damless = await this.giveme.resolve("damless");
        damless.emit(this.methodName.toLowerCase(), { context, service, headers });
        return await fn.call(service, context, stream, headers, flags);
    };
};

exports = module.exports = Get;
