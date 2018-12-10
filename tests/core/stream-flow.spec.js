/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const {
    ArrayToStream,
    StreamFlow,
    getAll,
    ending
} = require("../../lib/core");
const { Transform } = require('stream');

describe("stream-flow", () => {

    it("create a StreamFlow", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamFlow(
            stream => {
                return stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk.toUpperCase());
                        }
                    }))
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            callback(null, chunk.replace(/ /g, ";"));
                        }
                    }))
            }
        );


        const all = await getAll(stream.pipe(flow));
        expect(all).to.eql([
            "EXECUTE;MULTIPLES",
            "PIPES;INSIDE",
            "A;STREAM"
        ]);
    });

    it("throw an error in a StreamFlow", async () => {
        const stream = new ArrayToStream(["Execute multiples", "pipes inside", "a stream"]);
        const flow = new StreamFlow(
            stream => {
                return stream
                    .pipe(new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk == "pipes inside") callback(new Error("Test"))
                            else callback(null, chunk.toUpperCase());
                        }
                    }))
            }
        );

        try {
            await ending(stream.pipe(flow));
            throw new Error();
        }
        catch (error) {
            expect(error.message).to.be("Test");
        }
    });

})