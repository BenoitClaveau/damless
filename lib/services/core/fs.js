/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { Error } = require("oups");
const fs = require("fs");
const p = require("path");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

class FileSystem {
    constructor(giveme) {
        if (!giveme) throw new Error("giveme instance is not defined.");
        this.giveme = giveme;
    };

    absolutePath(path) {
        return p.resolve(this.giveme.root, path);
    }

    readFileSync(path, options) {
        if (typeof path == "string") {
            const absolutepath = this.absolutePath(path);
            try {
                return fs.readFileSync(absolutepath, options);
            } 
            catch(error) {
                throw new Error("Failed to read ${path}.", { path: absolutepath }, error);
            }
        }
        throw new Error("Path is not a string.", { type: typeof path });
    }

    async readFile(path, options) {
        if (typeof path == "string") {
            const absolutepath = this.absolutePath(path);
            try {
                return readFile(absolutepath, options);
            } 
            catch(error) {
                throw new Error("Failed to read ${path}.", { path: absolutepath }, error);
            }
        }
        throw new Error("Path is not a string.", { type: typeof path });
    }

    async stat(path, options) {
        if (typeof path == "string") {
            const absolutepath = this.absolutePath(path);
            try {
                return stat(absolutepath);
            } 
            catch(error) {
                throw new Error("Failed to stat ${path}.", { path: absolutepath }, error);
            }
        }
        throw new Error("Path is not a string.", { type: typeof path });
    }

    loadSync(path) {
        if (!path) return {};
        if (path instanceof Object) return path;
        const file = this.readFileSync(path);
        try {
            return JSON.parse(file);
        }
        catch(error) {
            throw new Error("Failed to parse ${file}.", { file }, error);
        }
    }
}

exports = module.exports = FileSystem;