/*!
 * damless
 * Copyright(c) 2021 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class Cors {

    constructor() {
        this.options = {
            window: 10, // `window` of 60s
            max: 10, // max number of recent connections during `window` milliseconds before sending a 429 status = Too Many Requests (RFC 6585)
            frame: 6
        }
        this.hits = {
            // counter: 
            // frame
        };
    };

    async mount() {
        const interval = setInterval(() => this.reset, this.options.window * 1000);
        if (interval.unref) {
            interval.unref();
        }
    }

    async invoke(context, stream, headers) {

        const incr = this.incr(context.ip);

        if (incr > this.options.max) {
            stream.headers = ({
                ...stream.headers,
                statusCode: 429,
                "retry-after": Math.ceil(this.options.window * this.options.frame),
            });
            return stream.end();
        }
    };

    incr(key) {
        const { counter, frame } = this.hits[key] ?? { counter: 0, frame: 0 };
        this.hits[key] = { counter: counter + 1, frame };
        return counter + 1;
    };

    reset() {
        const newhits = {};
        for (const [key, { counter, frame }] of this.hits.entries()) {
            if (counter > this.options.max && frame < this.options.frame) newhits[key] = { counter, frame: frame + 1};
        }
        this.hits = newhits;
    };
};



exports = module.exports = Cors;