/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

class Commands {

    constructor() {
        this.commands = [];
        this.mounted = false;
    }

    async mount() {
        await this.run();
        this.mounted = true;
    }

    async unmount() {
        this.mounted = false;
    }

    async run() {
        let fn;
        while ((fn = this.commands.shift()) !== undefined) {
            await fn();
        }
    }

    async push(fn) {
        this.commands.push(fn);
        if (this.mounted) await this.run();
    }
};

module.exports = Commands