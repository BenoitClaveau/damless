/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const {UndefinedError } = require("oups");
const { Transform } = require('stream');

/** 
 * flow(
 *   stream => {
 *      return stream
 *               .pipe(...)   
 *               .pipe(...)
 *               ...
 *   }
 * )
 * 
*/

class StreamFlow extends Transform {

    constructor(...argv) {
        const fn = argv.pop(); //last argument (required)
        const options = argv.shift(); //first argument (optionsl)

        super(options || { readableObjectMode: true });
        
        this.inner = new Transform({
            transform: (chunk, encoding, callback) => {
                callback(null, chunk);
            }
        });

        const stream = fn(this.inner);
        if (!stream) throw new UndefinedError("Stream is not returned.");
        
        stream.on("data", data => {
            this.push(data);
        })
        .on("end", data => {
            if (data) this.push(data);
            this.push(null);
        })
        .on("drain", () => {
            this.emit("drain");
        })
        .on("error", error => {
            this.emit("error", error);
        });
    };

    _transform(chunk, encoding, callback) {
        this.inner.push(chunk);
        callback();
    };

    _flush() {
        this.inner.push(null);
    };
};

flow = (...args) => {
    return new StreamFlow(...args);
}

module.exports.flow = flow;