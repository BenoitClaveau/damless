/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
const { 
    UndefinedError, 
    Error 
} = require("oups");
const path = require("path");
const Asset = require("../routes/asset");

class AssetsLoader {
    constructor(damless, giveme, fs, config, walk) {
        if (!damless) throw new UndefinedError("damless");
        if (!giveme) throw new UndefinedError("giveme");
        if (!fs) throw new UndefinedError("fs");
        if (!config) throw new UndefinedError("config");
        if (!walk) throw new UndefinedError("walk");
        this.damless = damless;
        this.giveme = giveme;
        this.fs = fs;
        this.config = config;
        this.walk = walk;
    };
    
    //Do not use mount, need to be call manualy.
    async load() {
        const { 
            config, 
            fs, 
            walk, 
            damless, 
            giveme 
        } = this;
        
        if(!config.assets || /false/ig.test(config.assets)) return;
       const folder = path.resolve(giveme.root, config.assets);
        try {
            await fs.stat(folder);
        }
        catch (error) {
            throw new Error("Failed to read public assets folder ${folder}.", { folder: folder }, error);
        }
        const files = walk.get(folder);
        for (let filepath of files) {
            let route = filepath.substring(folder.length);
            try {
                await damless.asset(route, filepath, { auth: false });
            }
            catch(error) {
                console.error(error);
            }
        }
    };
};

exports = module.exports = AssetsLoader;