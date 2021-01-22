/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../index");
const fetch = require("node-fetch");
const fs = require("fs");

describe("stress test", () => {

    let damless;
    beforeEach(() => 
        damless = new DamLess()
            .cwd(__dirname)
    )
    afterEach(async () => await damless.stop());

    it("50 clients", async () => {
        await damless
            .config({ http: { port: 3000 } })
            .get("/", (context, stream, headers) => {
                fs.createReadStream(`${__dirname}/data/npm.array.json`)
                    .pipe(stream)
            })
            .start();

        
        function* requests() {
            for(let i = 0; i < 50; i++) {
                yield fetch(`http://localhost:3000?index=${i}`, {
                    method: "GET",
                }).then(res => res.json());
            }
        }

        const values = await Promise.all(requests());
        expect(values.length).eql(50)

    }).timeout(20000);





});
