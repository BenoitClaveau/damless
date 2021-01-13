/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require("oups");
const { Transform, Readable } = require("stream");

const streamify = (action) => {

    if (typeof action == "function") {
        return Readable.from(async function* () {
            yield await action();
        }());
    }

    if (Array.isArray(action)) {
        return Readable.from(async function* () {
            for (let item of action) {
                yield item;
            }
        }());
    }

    return Readable.from(async function* () {
        yield action;
    }());
}

const transform = (action) => {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, callback) {
            try {
                const res = await action(chunk, encoding);
                callback(null, res);
            }
            catch (error) {
                callback(error);
            }
        }
    });
}

const aggregate = (action) => {
    const data = [];
    return new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            try {
                data.push(chunk);
                callback();
            }
            catch (error) {
                callback(error);
            }
        },
        async flush(callback) {
            const res = await action(data);
            callback(null, res);
        }
    });
}

noop = () => {
    return transform((chunk, encoding) => chunk);
}

module.exports.streamify = streamify;
module.exports.transform = transform;
module.exports.aggregate = aggregate;
module.exports.noop = noop;