/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../index");

describe("http-router", () => {

    let damless;
    beforeEach(() => 
        damless = new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .inject("info", "./services/info")
    )
    afterEach(async () => await damless.stop());

    it("get", async () => {
        await damless
            .get("/whoiam", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        const res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("post", async () => {
        await damless
            .post("/whoiam", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        const res = await client.post("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("put", async () => {
        await damless
            .put("/whoiam", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        const res = await client.put("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("patch", async () => {
        await damless
            .patch("/whoiam", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        const res = await client.patch("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("delete", async () => {
        await damless
            .delete("/whoiam", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        const res = await client.delete("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
    });

    it("multiple route", async () => {
        await damless
            .get("/whoiam", "info", "whoiam")
            .get("/helloworld", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route", async () => {
        await damless
            .get("/helloworld", "info", "helloworld")
            .get("/*", "info", "whoiam")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("default route inverted", async () => {
        await damless
            .get("/*", "info", "whoiam")
            .get("/helloworld", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple token", async () => {
        await damless
            .get("/*", "info", "whoiam")
            .get("/*/*", "info", "helloworld")
            .start();
        const client = await damless.resolve("client");
        let res = await client.get("http://localhost:3000/whoiam");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/test");
        expect(res.body).to.be("I'm Info service.");
        res = await client.get("http://localhost:3000/helloworld/3");
        expect(res.body).to.be("Hello world.");
        res = await client.get("http://localhost:3000/test/3");
        expect(res.body).to.be("Hello world.");
    });

    it("multiple end route", async () => {
        try {
            await damless
                .get("/whoiam", "info", "whoiam")
                .get("/whoiam", "info", "helloworld")
                .start();
            throw new Error("Failed");
        } 
        catch(error) {
            expect(error.message).to.be("Failed the register helloworld of info for GET:/whoiam");
        }
    }).timeout(20000);
});