/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const { ArrayToStream, ending } = require("../../lib/core");
const { Transform } = require('stream');

describe("array-to-stream", () => {

    it("Convert an array to a stream", async () => {
        const stream = new ArrayToStream([1,2,3]);
        const output = [];
        stream
            .pipe(new Transform({ 
                objectMode: true, 
                transform(chunk, encoding, callback) {
                    output.push(chunk);
                    callback();
                }
            }))
        await ending(stream);
        expect(output).to.eql([1,2,3]);
    });
})