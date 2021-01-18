/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const fs = require("fs");
const { pipeline, Writable } = require("stream");
const request = require("request");

describe("eply", () => {

    let damless;
    beforeEach(async () => {
        damless = new DamLess()
            .cwd(__dirname)
    })
    afterEach(async () => await damless.stop());

    it("reply testpost", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .get("/", (context, stream, headers) => {
                console.log("ok")
                stream.write("SUPER");
                stream.write("COOL");
                stream.end("FIN")
            })
            .start();


        const client = await damless.resolve("client");
        const filename = `${__dirname}/../data/output/4.json`
        if (fs.existsSync(filename))
            fs.unlinkSync(filename);
            
        await new Promise((resolve) => {
            request('http://localhost:3000/')
                .pipe(fs.createWriteStream(filename))
                .on("finish", resolve)
        })

    }).timeout(20000);


});
