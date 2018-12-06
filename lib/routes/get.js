/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Error } = require("oups");
const { ending } = require("../core");

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

    async init(argv0, argv1, argv2) {
        this.middleware = await this.giveme.resolve("middleware");
        // Anonymous method. Ex: init((context, stream, header) => {}, options)
        if (typeof argv0 == "function") {
            this.method = argv0;
            this.options = { ...this.options, ...(argv1 || {}) };
        }
        // Only options. Ex: init(options). Usefull if the middleware respond.
        else if (typeof argv0 == "object") {
            this.options = { ...this.options, ...(argv0 || {}) };
        }
        // Standard Ex: init(serviceName, methodName, options)
        else {
            this.serviceName = argv0;
            if (!this.serviceName) throw new Error("Service for ${route} is not defined.", { route: this.route });
            
            this.service = await this.giveme.resolve(this.serviceName);
            if (!this.service) 
                throw new Error("${serviceName} for ${route} is not defined.", { serviceName: this.serviceName, route: this.route });

            this.methodName = argv1;
            if (!this.methodName) throw new Error("Method for ${route} not defined.", { route: this.route });
        
            this.method = this.service[this.methodName];
            if (!this.method)
                throw new Error("${methodName} in ${serviceName} for ${route} is not defined.", { serviceName: this.serviceName, methodName: this.methodName, route: this.route });
            
            this.options = { ...this.options, ...(argv2 || {}) }
        }
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
        const completed = ending(stream, { resume: false }); // wait stream ending to catch error.
        fn.call(service, context, stream, headers, flags);
        await completed;
    };
};

exports = module.exports = Get;
