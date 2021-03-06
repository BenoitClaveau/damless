/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const path = require("path");
const fs = require("fs");
const util = require("util");
const { Error, UndefinedError } = require("oups");

const readFile = util.promisify(fs.readFile);

class Repository {
    constructor(folder, walk) {
        if (!folder) throw new UndefinedError("Folder", { folder: folder });
        this.folder = folder;
        this.walk = walk;
    };

    async mount() {
        const files = this.walk.get(this.folder);
        for (let filepath of files) {            
            let route = filepath.substring(this.folder.length);
            let ext = path.extname(route).substr(1); //get extension without .
            route = route.slice(0, -(ext.length + 1)); //get file name withous extension and .
            let routes = route.split("/");
            
            let data = this;
            for (let token of routes) {
                if(!token) 
                    continue; //if filepath start with /
                data[token] = data[token] || {};
                data = data[token];
            }
            
            //TODO change encoding according to the extension
            if(data[ext]) throw new Error("File ${file} already exists.", { file: filepath });
            
            const content = await readFile(filepath, "utf8");
            data[ext] = content;
        };
    }

    find(key) {
        let template = this;
        let keys = key.split(".");
        let temps = [];
        while(keys.length) {
            const name = keys.join(".");
            if (name in template) {
                template = template[name];
                keys = temps;
                temps = [];
                if (!keys.length) return template;
            }
            else {
                const item = keys.pop();
                temps.splice(0, 0, item);
            }
        }
        throw new Error("Not found ${key} file in ${folder}.", { key, folder: this.folder });
    }
};

class RepositoryFactory {
    
    constructor(giveme, walk) {
        this.giveme = giveme;
        this.walk = walk;
    }

    async create(folder) {
        const repository = new Repository(path.resolve(this.giveme.root, folder), this.walk);
        await repository.mount();
        return repository;
    }
}

exports = module.exports = RepositoryFactory;