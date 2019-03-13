/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const fs = require("fs");
const { 
    ArrayToStream, 
    getFirst,
    getAll,
    getBuffer
} = require("../../lib/streams");
const { Readable } = require('stream');

describe("promise-readable", () => {

    it("getFirst", async () => {
        const stream = new ArrayToStream([1,2,3]);
        const first = await getFirst(stream);
        expect(first).to.be(1);
    });

    it("getFirst with stream.end", async () => {
        const stream = new Readable({
            objectMode: true,
            read() {}
        });
        setTimeout(() => {
            stream.emit("end", 1);
        }, 500);
        const first = await getFirst(stream);

        expect(first).to.be(1);
    });

    it("getFirst with error", async () => {
        const stream = new ArrayToStream(null);
        const res = await getFirst(stream);
        expect(res).to.be(null);
    });

    it("getAll", async () => {
        const stream = new ArrayToStream([1,2,3]);
        const all = await getAll(stream);
        expect(all).to.eql([1,2,3]);
    });

    it("getAll with error", async () => {
        const stream = new ArrayToStream();
        const all = await getAll(stream);
        expect(all).to.eql([]);
    });

    it("getBuffer", async () => {
        const stream = fs.createReadStream(`${__dirname}/../data/world.png`);
        const buffer = await getBuffer(stream);
        expect(buffer).to.be.an(Buffer);
        fs.writeFileSync(`${__dirname}/../data/output/world.buffer.png`, buffer);
    });
})