/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const CryptoService = require("../../../lib/services/core/crypto");
const PasswordService = require("../../../lib/services/core/password");

require("process").on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
});

describe("password", () => {
    it("generate", () => {
        const passwordService = new PasswordService(new CryptoService());
        const { password, clear, salt } = passwordService.generate();
        expect(salt).not.to.be(null);
        expect(clear).not.to.be(null);
        expect(password).not.to.be(null);
    });
});
