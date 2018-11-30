/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class EventEmitterMiddleware {

    constructor(giveme, eventEmitter) {
        this.giveme = giveme;
        this.eventEmitter = eventEmitter;
    };

    async invoke(context, stream, headers) {
        const {
            route: {
                service
            }
        } = context;

        this.eventEmitter.emit("invoke", { context, headers, service });
    }
}

module.exports = EventEmitterMiddleware;