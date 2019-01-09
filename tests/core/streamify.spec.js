/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Error } = require("oups");
const expect = require("expect.js");
const {
    streamify,
    transform,
    getAll,
    StreamToArray
} = require("../../lib/core");
const { pipeline } = require("stream");
const { promisify } = require("util");
const pipelineAsync = promisify(pipeline);

describe("streamify", () => {

    it("streamify a function", async () => {
        const stream = streamify(() => {
            return { value: 1 };
        });

        const all = await getAll(stream);
        expect(all).to.eql([{ value: 1 }]);
    });

    it("streamify an array", async () => {
        const stream = streamify([1,2,3]);
        const all = await getAll(stream);
        expect(all).to.eql([1,2,3]);
    });

    it("streamify an object", async () => {
        const stream = streamify({ value: 1 });
        const all = await getAll(stream);
        expect(all).to.eql([{ value: 1 }]);
    });

    it("transform", async () => {
        const stream = streamify([1,2,3]);
        const output = new StreamToArray();
        await pipelineAsync(
            stream,
            transform((chunk, encoding, callback) => {
                return chunk - 1;
            }),
            output
        );

        expect(output.array).to.eql([0,1,2]);
    });

    it("transform throw error", async () => {
        try {
            const stream = streamify([1,2,3]);
            const output = new StreamToArray();
            await pipelineAsync(
                stream,
                transform((chunk, encoding, callback) => {
                    if (chunk == 2) throw new Error("Boom");
                    return chunk;
                }),
                output
            );
            throw new Error("Mustn't not be executed.");
        }
        catch(error) {
            expect(error.message).to.be("Boom");
        }
    });
})