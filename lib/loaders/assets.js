/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const {
    Error,
    UndefinedError
} = require("oups");
const path = require("path");

class AssetsLoader {
    constructor(httpServer, giveme, fs, config, walk) {
        this.httpServer = httpServer;
        this.giveme = giveme;
        this.fs = fs;
        this.config = config;
        this.walk = walk;
    };

    //Do not use mount, need to be call manualy.
    async load() {
        const {
            config
        } = this;

        if (!config.assets || /false/ig.test(config.assets)) return;
        const assets = Array.isArray(config.assets) ? config.assets : [config.assets];
        for (let asset of assets) {
            await this.add(asset);
        }
    };

    async add(asset) {
        const {
            fs,
            walk,
            httpServer,
            giveme
        } = this;
        if (!asset) throw new UndefinedError("asset");

        let data = asset;
        if (typeof asset == "string") {
            data = {
                path: asset,
                route: null
            };
        }

        if (!data.path) throw new UndefinedError("path");

        const folder = path.resolve(giveme.root, data.path);

        let res;
        try {
            res = await fs.stat(folder);
        }
        catch (error) {
            throw new Error("Failed to read public assets folder ${folder}.", { folder }, error);
        }

        if (res.isDirectory()) {
            const files = walk.get(folder);
            for (let filepath of files) {
                let route = filepath.substring(folder.length);
                if (data.route) route = `${data.route}${route}`;
                if (data.filter instanceof RegExp) {
                    if (data.filter.test(route) == false) continue;
                }
                try {
                    await httpServer.asset(route, filepath);
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
        if (res.isFile()) {
            const filepath = folder;
            let route = filepath.substring(folder.length);
            if (data.route) route = `${data.route}${route}`;
            if (data.filter instanceof RegExp) {
                if (data.filter.test(route) == false) return;
            }
            try {
                await httpServer.asset(route, filepath);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
};

exports = module.exports = AssetsLoader;