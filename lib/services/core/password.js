/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

class PasswordService {
    constructor(crypto) {
        this.crypto = crypto;
    }

    generatePassword() {
        let keylist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let keylist2 = keylist + "_-+&*."

        let value = keylist.charAt(Math.floor(Math.random() * keylist.length));
        for (let i = 0; i < 4; i++)
            value += keylist2.charAt(Math.floor(Math.random() * keylist2.length));
        value += keylist.charAt(Math.floor(Math.random() * keylist.length));

        if (/\d/.test(value) == false) return this.generatePassword();

        return value;
    }

    /**
     * If clear is null, undefined or == '' we generate a new password
     */
    generate(clear, salt) {
        if (!clear) clear = this.generatePassword();
        if (!salt) salt = this.crypto.iv;
        if (typeof clear == "number" ) clear = clear.toString();

        if (!Buffer.isBuffer(salt)) 
            salt = Buffer.from(salt, "base64");
            
		const password = this.crypto.pbkdf2(clear, salt);
		const s = salt.toString("base64");
		const p = password.toString("base64");
        return {
            password: p,
            salt: s,
            clear
        };
    }
};

exports = module.exports = PasswordService;
