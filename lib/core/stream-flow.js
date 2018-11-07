/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const {UndefinedError } = require("oups");
const { Passthrough, Readable } = require('stream');

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

class StreamFlow extends Passthrough {

    constructor(...argv) {
        const fn = argv.pop(); //last argument (required)
        const options = argv.shift(); //first argument (optionsl)

        super(options || { readableObjectMode: true });
        
        this.inner = new Readable({
            objectMode: true,
            read: () => {}
        });

        const stream = fn(this.inner);
        if (!stream) throw new UndefinedError("Stream is not returned.");
        
        stream.on("data", data => {
            const ret = this.push(data);
            if (!ret) {
              this.pause();
            }
        })
        .on("end", () => {
            this.push(null);
        })
        .on("drain", () => {
            this.emit("drain");
        })    
    };

    write(chunk, encoding, callback) {
        this.inner.push(chunk);
    };

    _flush() {
        this.inner.push(null);
    };
};

flow = (...args) => {
    return new StreamFlow(...args);
}

module.exports.flow = flow;
