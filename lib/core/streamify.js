/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError } = require("oups");
const { Transform, Readable } = require("stream");

streamify = (action) => {
    let done = false;
    return Readable({
        objectMode: true,
        read: async function () {
            try {
                if (done) return;
                done = true;
                const type = typeof action == "function" ? "function" : Array.isArray(action) ? "array" : "object" ;
                switch(type) {
                    case "function": {
                        const res = await action();
                        if (res) this.push(res);
                        break;
                    }
                    case "array": {
                        for(let item of action) {
                            if (!item) throw new UndefinedError();
                            else this.push(item);
                        }
                        break;
                    }
                    default: {
                        if (action)
                        this.push(action); 
                        break;
                    }
                }
                this.push(null);
                return null;
            }
            catch(error) {
                const { pipes, pipesCount } = this._readableState;
                if (Array.isArray(pipes)) {
                    for (var i = 0; i < pipesCount; i++)
                        pipes[i].emit("error", error);
                }
                else if (pipes) {
                    pipes.emit("error", error);
                }
            }
        },
    });
}

transform = (action) => {
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

noop = () => {
    return transform((chunk, encoding) => chunk);
}

module.exports.streamify = streamify;
module.exports.transform = transform;
module.exports.noop = noop;