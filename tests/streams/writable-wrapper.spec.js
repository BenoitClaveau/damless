/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const fs = require("fs");
const { promisify } = require("util");
const stream = require("stream");
const { Writable, Readable, Transform, finished, PassThrough } = require("stream");
const WritableWrapper = require("../../lib/streams/writable-wrapper");
const JSONStream = require("JSONStream");
const pipeline = promisify(stream.pipeline);

describe("writable-wrapper", () => {

    it("write text", async () => {
        const filename = `${__dirname}/../data/output/2.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const stream = fs.createWriteStream(filename);
        const writable = new WritableWrapper(stream);

        await new Promise((resolve) => {    
            Readable.from(async function* () {
                yield "cool";
                yield "super";
            }())
                .pipe(writable)
                .on("finish", resolve)
        })
    });

    it("write JSONStream (though)", async () => {
        const filename = `${__dirname}/../data/output/3.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const stream = fs.createWriteStream(filename);
        const writable = new WritableWrapper(stream);

        await pipeline(
            Readable.from(async function* () {
                yield { line: 1 };
                yield { line: 2 };
            }()),
            JSONStream.stringify(),
            writable
        )
    }).timeout(20000);

    it("JSONStream", async () => {
        const filename = `${__dirname}/../data/output/10.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const writable = fs.createWriteStream(filename);
        const stream = JSONStream.stringify();

        const output = new WritableWrapper(writable);
        stream.pipe(output);
        stream.write({ok: 1})
        stream.write({ok: 2})
        stream.end();

        await new Promise(resolve => {
            finished(writable, resolve);
        });

    }).timeout(20000);


    it("wrap JSONStream (though)", async () => {
        const readable = fs.createReadStream(`${__dirname}/../data/npm.light.array.json`);
        const filename = `${__dirname}/../data/output/9.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);

        const writable = fs.createWriteStream(filename);

        const stringify = JSONStream.stringify();
        stringify.pipe(writable);

        // Le point d'entrée est stringifyet et on pas writable.
        // Par contre stringify est considéré comme un flux de fin (writable).
        const output = new WritableWrapper(stringify);
        
        await pipeline(
            readable,
            JSONStream.parse("*"),
            output // write JS Object            
        );
    }).timeout(20000);

    it("throw error in pipeline", async () => {
        try {
            await pipeline(
                Readable.from(async function* () {
                    yield { line: 1 };
                    yield { line: 2 };
                    yield { line: 3 };
                }()),
                new WritableWrapper(function* () {
                    yield new PassThrough({ objectMode: true });
                    yield new Transform({
                        objectMode: true,
                        transform(chunk, encoding, callback) {
                            if (chunk.line == 2) callback(new Error("line == 2"))
                            else callback(null, chunk);
                        }
                    });
                    yield new Writable({
                        objectMode: true,
                        write(chunk, encoding, callback) {
                            callback();
                        }
                    });
                }, { objectMode: true })
            );
            throw new Error("Unexpected behavior.")
        } 
        catch(error) {
            expect(error.message).to.eql("line == 2")
        }
    }).timeout(20000);

    it("neasted writable wrapper", async () => {
        try {
            await pipeline(
                Readable.from(async function* () {
                    yield { line: 1 };
                    yield { line: 2 };
                    yield { line: 3 };
                }()),
                new WritableWrapper(function* () {
                    yield new PassThrough({ objectMode: true });
                    yield new WritableWrapper(function* () {
                        yield new Transform({
                            objectMode: true,
                            transform(chunk, encoding, callback) {
                                if (chunk.line == 2) callback(new Error("line == 2"))
                                else callback(null, chunk);
                            }
                        });
                        yield new Writable({
                            objectMode: true,
                            write(chunk, encoding, callback) {
                                expect(chunk.line).to.eql(1) // car erreur au 2ème chunk
                                callback();
                            }
                        })}, { objectMode: true })
                }, { objectMode: true })
            );
            throw new Error("Unexpected behavior.")
        } 
        catch(error) {
            expect(error.message).to.eql("line == 2")
        }
    }).timeout(20000);

});
