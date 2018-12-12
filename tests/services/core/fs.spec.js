/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const FileSystem = require('../../../lib/services/core/fs');
const $fs = new FileSystem({ root: __dirname });

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("FileSystem", () => {

    it("readFile", async () => {
        const file = await $fs.readFile(`${__dirname}/../../data/npm.array.json`);
        expect(file.length).to.above(382000);
    });

    it("stat", async () => {
        const stat = await $fs.stat(`${__dirname}/../../data`);
        expect(stat.mode).to.above(16800);            
    });

    it("load", () => {
        const file = $fs.loadSync(`${__dirname}/../../data/npm.array.json`);
        expect(file.length).to.be(4028);            
    });
});
