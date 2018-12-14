/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const DamLess = require("../../../index");

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("Repository", () => {
   
    let damless;
    beforeEach(async () => {
        damless = await new DamLess()
            .cwd(__dirname)
            .config({ http: { port: 3000 }})
            .start();
    })
    afterEach(async () => await damless.stop());

    it("create a repository", async () => {
        const repositoryFactory = await damless.resolve("repository-factory");
        const repository = await repositoryFactory.create(__dirname);
        const properties = Object.keys(repository);
        expect(properties.length).to.be(11);
    });

    it("find a key", async () => {
        const repositoryFactory = await damless.resolve("repository-factory");
        const repository = await repositoryFactory.create(__dirname);
        expect(repository.find("walk.spec").js).not.to.be(undefined);
    });

    it("file not found", async () => {
        const repositoryFactory = await damless.resolve("repository-factory");
        const repository = await repositoryFactory.create(__dirname);
        try {
            repository.find("walk.js");
            throw new Error();
        }
        catch(error) {
            expect(error.message).to.be(`Not found walk.js file in ${__dirname}.`);
        }
    });
});