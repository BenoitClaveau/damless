/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../index");
const { context } = require("fetch-h2");
const process = require("process");
const { inspect } = require("util");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

describe("http-server", () => {

    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
    })
    afterEach(async () => await damless.stop());

    it("create a http server", async () => {
        await
            damless
                .cwd(__dirname)
                .config({
                    http: {
                        port: 3001
                    }
                })
                .inject("info", "./services/info")
                .post("/save", "info", "saveOne")
                .start();

        const client = await damless.resolve("client");
        const res = await client.post({
            url: "http://localhost:3001/save",
            json: {
                name: "ben",
                value: 0,
                test: 454566
            }
        });
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    }).timeout(60000);


    it("create a https server", async () => {
        await
            damless
                .cwd(__dirname)
                .config({
                    https: {
                        port: 8443,
                        cert: `${__dirname}/certificates/server.crt`,
                        key: `${__dirname}/certificates/server.key`,
                    }
                })
                .inject("info", "./services/info")
                .post("/save", "info", "saveOne")
                .start();

        const client = await damless.resolve("client");
        const res = await client.post({
            url: "https://localhost:8443/save",
            rejectUnauthorized: false, // Only for testing because of self signed certificate
            json: {
                name: "ben",
                value: 0,
                test: 454566
            }
        });
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);
    }).timeout(60000);

    it("create a http2 server", async () => {
        await
            damless
                .cwd(__dirname)
                .config({
                    http2: {
                        port: 8443,
                        cert: `${__dirname}/certificates/server.crt`,
                        key: `${__dirname}/certificates/server.key`,
                    }
                })
                .inject("info", "./services/info")
                .post("/save", "info", "saveOne")
                .start();

        const { fetch } = context({
            session: { rejectUnauthorized: false },
        });

        const response = await fetch("https://localhost:8443/save", {
            method: "POST",
            json: {
                name: "ben",
                value: 0,
                test: 454566
            },
        });

        const data = await response.json();
        expect(data.name).to.be("ben");
        expect(data.value).to.be(0);
        expect(data.test).to.be(454566);
    }).timeout(60000);

    it("create a http2 server with http1 client", async () => {
        await
            damless
                .cwd(__dirname)
                .config({
                    http2: {
                        port: 8443,
                        cert: `${__dirname}/certificates/server.crt`,
                        key: `${__dirname}/certificates/server.key`,
                    }
                })
                .inject("info", "./services/info")
                .post("/save", "info", "saveOne")
                .start();

        const client = await damless.resolve("client");
        const res = await client.post({
            url: "https://localhost:8443/save",
            rejectUnauthorized: false, // Only for testing because of self signed certificate
            json: {
                name: "ben",
                value: 0,
                test: 454566
            }
        });
        expect(res.body.name).to.be("ben");
        expect(res.body.value).to.be(0);
        expect(res.body.test).to.be(454566);

    }).timeout(60000);

    it("create a http2 unsecure server", async () => {
        await
            damless
                .cwd(__dirname)
                .config({
                    "http2-unsecure": {
                        port: 8443
                    }
                })
                .inject("info", "./services/info")
                .post("/save", "info", "saveOne")
                .start();

        const { fetch } = context({
            session: { rejectUnauthorized: false },
        });

        const response = await fetch("http://localhost:8443/save", {
            method: "POST",
            json: {
                name: "ben",
                value: 0,
                test: 454566
            }
        });

        const data = await response.json();
        expect(data.name).to.be("ben");
        expect(data.value).to.be(0);
        expect(data.test).to.be(454566);

    }).timeout(60000);
});
