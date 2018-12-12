/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const {
    streamify,
    getAll
} = require("../../lib/core");

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
})