/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");

describe("Load middleware", () => {
   
    let damless;
    beforeEach(() => {
        damless = new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
    })
    afterEach(async () => await damless.stop());

    it("Use auth-jwt middleware", async () => {
        await damless
            .use("auth-jwt")
            .get("/", (context, stream, header) => {
                stream.end({ ok: true });
            })
            .start();
        const middleware = await damless.resolve("middleware");
        expect(middleware.middlewares.length).to.be(1);

        const client = await damless.resolve("client");
        try {
            await client.get({ url: "http://localhost:3000/" });
            throw new Error();
        }
        catch(error) {
            expect(error.statusCode).to.be(401);
            expect(error.data.message).to.be("Authentication has failed for GET:/.");
        }

    }).timeout(5000);

    it("Use forward-to-asset middleware", async () => {

        await damless
            .config(config => {
                config.assets = "./public"
            })
            .use("forward-to-asset")
            .get("/", { forwardTo: "/main.html"})
            .start();
        
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/" });
        expect(res.statusCode).to.be(200);
        expect(res.body.slice(0, 15)).to.be("<!DOCTYPE html>");

    }).timeout(5000);

    it("Use forward-to-asset without loading assets", async () => {

        await damless
            .use("forward-to-asset")
            .get("/", { forwardTo: "/main.html"})
            .start();
        
        const client = await damless.resolve("client");
        try {
            await client.get({ url: "http://localhost:3000/" });
            throw new Error();
        }
        catch(error) {
            expect(error.statusCode).to.be(404);
            expect(error.data.message).to.be("Failed to forward / to /main.html");
        }

    }).timeout(5000);

    it("Inject middleware anonymous function", async () => {

        await damless
            .use((context, stream, headers) => {
                stream.headers({ "x-custom-header": "1234" })
            })
            .get("/", (context, stream, header) => {
                stream.end({ ok: true });
            })
            .start();
        
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/" });
        expect(res.statusCode).to.be(200);
        expect(res.headers["x-custom-header"]).to.be("1234");
    }).timeout(5000);

    xit("Inject middleware for 404", async () => {

        await damless
            .use((context, stream, headers) => {
                if ("404" in context.route) {
                    stream.end({ ok: false });
                }
            })
            .get("/", (context, stream, header) => {
                stream.end({ ok: true });
            })
            .start();
        
        const client = await damless.resolve("client");
        const res = await client.get({ url: "http://localhost:3000/" });
        expect(res.statusCode).to.be(200);
        expect(res.body).to.be('[\n{"ok":true}\n]\n');

        const res2 = await client.get({ url: "http://localhost:3000/info" });
        expect(res2.statusCode).to.be(200);
        expect(res2.body).to.be('[\n{"ok":false}\n]\n');
    }).timeout(5000);
})