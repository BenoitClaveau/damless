/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

 const expect = require("expect.js");
const DamLess = require("../../../index");
const fs = require("fs");

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("json-stream", () => {

    it("parse array", async () => {
        const $json = await damless.resolve("json-stream");

        fs.createReadStream(`${__dirname}/../../data/npm.array.json`)
            .pipe($json.parse()).on("data", chunk => {
                expect(chunk).property("id");
                expect(chunk).property("key");
            });
    }).timeout(5000)

    it("parse object", async () => {
        const $json = await damless.resolve("json-stream");

        fs.createReadStream(`${__dirname}/../../data/npm.object.json`)
            .pipe($json.parse()).on("data", chunk => {
                expect(chunk.offset).to.be(0);
                expect(chunk.rows.length).to.be(4028);
                expect(chunk.total_rows).to.be(4028);
            });
    }).timeout(5000)
});
