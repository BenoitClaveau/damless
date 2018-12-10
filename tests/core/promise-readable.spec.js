/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const fs = require("fs");
const { 
    ArrayToStream, 
    ending,
    getFirst,
    getAll,
    getBuffer
} = require("../../lib/core");
const { Transform } = require('stream');

describe("promise-readable", () => {

    it("getFirst", async () => {
        const stream = new ArrayToStream([1,2,3]);
        const first = await getFirst(stream);
        expect(first).to.be(1);
    });

    it("getAll", async () => {
        const stream = new ArrayToStream([1,2,3]);
        const all = await getAll(stream);
        expect(all).to.eql([1,2,3]);
    });

    it("getBuffer", async () => {
        const stream = fs.createReadStream(`${__dirname}/../data/world.png`);
        const buffer = await getBuffer(stream);
        expect(buffer).to.be.an(Buffer);
        fs.writeFileSync(`${__dirname}/../data/output/world.buffer.png`, buffer);
    });
})