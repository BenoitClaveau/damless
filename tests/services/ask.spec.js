/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const { ending } = require("../../index");
const request = require("request");
const fs = require("fs");

let damless;
beforeEach(() => damless = new DamLess({ dirname: __dirname, config: { http: { port: 3000 }}}));
afterEach(async () => await damless.stop());

describe("ask", () => {

    it("post object -> object", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveOne")
            .start();
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: {
            name: "ben",
            value: 0,
            test: 454566
        }});
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    });

    it("post object -> array", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveMany")
            .start();
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: {
            name: "ben",
            value: 0,
            test: "454566"
        }});
        expect(res.body.length).to.be(1);
        expect(res.body[0].name).to.be("ben");
        expect(res.body[0].value).to.be(0);
        expect(res.body[0].test).to.be(454566);
    });

    it("post array -> object", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveOne")
            .start();
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: [
            {
                name: "ben",
                value: 0,
                test: "454566"
            },
            {
                name: "toto",
                value: 32,
                test: "zz"
            }
        ]})
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    });
    
    it("post array -> array", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveMany")
            .start();
        const client = await damless.resolve("client");
        const res = await client.post({ url: "http://localhost:3000/save", json: [
            {
                name: "ben",
                value: 0,
                test: "454566"
            },
            {
                name: "toto",
                value: 32,
                test: "zz"
            }
        ]})
        expect(res.body.length).to.be(2);
        expect(res.body[0].name).to.be("ben");
        expect(res.body[0].value).to.be(0);
        expect(res.body[0].test).to.be(454566);
        expect(res.body[1].name).to.be("toto");
        expect(res.body[1].value).to.be(32);
        expect(res.body[1].test).to.be("zz");
    });

    it("save json stream", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveMany")
            .start();
        const jsonstream = await damless.resolve("json-stream");

        let receive = false;
        let sending = false;

        await ending(
            fs.createReadStream(`${__dirname}/../data/npm.array.json`)
                .on("data", data => {
                    if (!sending) console.log("FIRST SENDING", new Date())
                    sending = sending || true;
                })
                .on("end", () => {
                    console.log("FILE END", new Date())
                })
                .pipe(request.post("http://localhost:3000/save"))
                .on("response", response => {
                    expect(response.headers["content-type"]).to.be("application/json; charset=utf-8");
                })
                .pipe(jsonstream.parse())
                .on("end", data => {
                    console.log("REQUEST END", new Date())
                })
                .on("data", data => {
                    if (!receive) console.log("FIRST RECEIVE", new Date())
                    receive = receive || true;
                })
        );
    });

    it("upload image stream", async () => {
        await damless
            .inject("info", "./info")
            .post("/save", "info", "saveMany")
            .start();
        const jsonstream = await damless.resolve("json-stream");

        let receive = false;
        let sending = false;

        await ending(
            fs.createReadStream(`${__dirname}/../data/npm.array.json`)
                .on("data", data => {
                    if (!sending) console.log("FIRST SENDING", new Date())
                    sending = sending || true;
                })
                .on("end", () => {
                    console.log("FILE END", new Date())
                })
                .pipe(request.post("http://localhost:3000/save"))
                .on("response", response => {
                    expect(response.headers["content-type"]).to.be("application/json; charset=utf-8");
                })
                .pipe(jsonstream.parse())
                .on("data", data => {
                    if (!receive) console.log("FIRST RECEIVE", new Date())
                    receive = receive || true;
                })
                .on("end", () => {
                    console.log("REQUEST END", new Date())
                })
        );
            
    });

    // it("upload json stream", async () => {
    //     await damless
    //         .inject("info", "./info")
    //         .post("/upload", "info", "saveFile")
    //         .start();

    //     const requestOptions = {
    //         formData : {
    //           file : fs.createReadStream(`${__dirname}/../data/npm.array.json`)
    //         },
    //         method : "POST",
    //         url    : "http://localhost:3000/upload",
    //         json: true
    //       };
        
    //     await ending(
    //         request(requestOptions, (error, response, body) => {
    //             expect(body.length).to.be(1);
    //             expect(body[0].filepath).to.be(`${__dirname}/../data/output/npm.array.json`);
    //         }).on("data", chunk => {
    //             process.stdout.write(".");
    //         }).on("response", response => {
    //             expect(response.headers["content-type"]).to.be("application/json")
    //         }).on("end", chunk => {
    //             console.log("66666644444444444444555555555555555")
    //         })
    //     );
    // });

    // xit("upload json object", async () => {
    //     await damless
    //         .inject("info", "./info")
    //         .post("/upload", "info", "saveFile")
    //         .start();

    //     const requestOptions = {
    //         formData : {
    //           file : fs.createReadStream(`${__dirname}/../data/npm.object.json`)
    //         },
    //         method : "POST",
    //         url    : "http://localhost:3000/upload",
    //         json: true
    //       };
        
    //     request(requestOptions, (error, response, body) => {
    //         expect(body.length).to.be(1);
    //         expect(body[0].filepath).to.be(`${__dirname}/../data/output/npm.object.json`);
    //     }).on("data", chunk => {
    //         process.stdout.write(".");
    //     }).on("response", response => {
    //         expect(response.headers["content-type"]).to.be("application/json")
    //     });
    // });

    // it("upload image stream", async () => {
    //     await damless
    //         .inject("info", "./info")
    //         .post("/upload", "info", "uploadImage")
    //         .start();

    //     const requestOptions = {
    //         formData : {
    //             file : fs.createReadStream(`${__dirname}/../data/world.png`)
    //         },
    //         method : "POST",
    //         url    : "http://localhost:3000/upload"
    //     };
        
    //     const filepath = `${__dirname}/../data/output/world.png`;
    //     if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    //     const output = fs.createWriteStream(filepath);
        
    //     request(requestOptions, (error, response, body) => {
    //         //console.log(body)
    //     }).on("data", chunk => {
    //         process.stdout.write(".");
    //     }).on("response", response => {
    //         expect(response.headers["content-type"]).to.be("image/png");
    //     }).pipe(output).on("finish", () => {
    //         expect(fs.existsSync(filepath)).to.be(true);
    //     });
    // });

    
});
