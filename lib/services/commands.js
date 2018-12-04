/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class Commands {

    constructor() {
        this.commands = [];
    }

    async mount() {
        let fn;
        while ((fn = this.commands.shift()) !== undefined) {
            await fn();
        }
    }

    push(fn) {
        this.commands.push(fn);
    }
};

module.exports = Commands