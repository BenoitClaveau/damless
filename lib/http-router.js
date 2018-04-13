/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { 
    Error, 
    HttpError, 
    UndefinedError 
} = require("oups");
const http2 = require(`http2`);
const {
	HTTP2_HEADER_METHOD, 
	HTTP2_HEADER_PATH,
	HTTP2_HEADER_STATUS,
	HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;

class HttpRouter {
    constructor(giveme, json, IsItForMe, OptionsLeaf) {
        if (!giveme) throw new UndefinedError("giveme");
        if (!json) throw new UndefinedError("json");
        if (!IsItForMe) throw new UndefinedError("IsItForMe");
        if (!OptionsLeaf) throw new UndefinedError("OptionsLeaf");
        this.giveme = giveme;
        this.json = json;
        
        for (let name of ["isitasset", "isitget", "isitpost", "isitput", "isitpatch", "isitdelete"]) {
            const service = new IsItForMe(json);
            this.giveme.inject(name, service);
        };
        this.giveme.inject("isoptions", new OptionsLeaf(this.giveme));
    };

    async unmount() {
        for (let name of ["isitasset", "isitget", "isitpost", "isitput", "isitpatch", "isitdelete"]) {
            const isitforme = await this.giveme.resolve(name);
            isitforme.clear();
        };
    }

    async get(route) {
        const { giveme } = this;
        const Get = await giveme.resolve("Get");
        const isitget = await giveme.resolve("isitget");
        const item = new Get(giveme, route);
        isitget.push(item);
        return item;
    };

    async post(route) {
        const { giveme } = this;
        const Post = await giveme.resolve("Post");
        const isitpost = await giveme.resolve("isitpost");
        const item = new Post(giveme, route);
        isitpost.push(item);
        return item;
    };

    async delete(route) {
        const { giveme } = this;
        const Delete = await giveme.resolve("Delete");
        const isitdelete = await giveme.resolve("isitdelete");
        const item = new Delete(giveme, route);
        isitdelete.push(item);
        return item;
    };

    async put(route) {
        const { giveme } = this;
        const Put = await giveme.resolve("Put");
        const isitput = await giveme.resolve("isitput");
        const item = new Put(giveme, route);
        isitput.push(item);
        return item;
    };

    async patch(route) {
        const { giveme } = this;
        const Patch = await giveme.resolve("Patch");
        const isitpatch = await giveme.resolve("isitpatch");
        const item = new Patch(giveme, route);
        isitpatch.push(item);
        return item;
    };

    async asset(route) {
        const { giveme } = this;
        const Asset = await giveme.resolve("Asset");
        const isitasset = await giveme.resolve("isitasset");
        const item = new Asset(giveme, route);
        isitasset.push(item);
        return item;
    };

    async leaf(method, pathname) {
        switch (method) {
            case "GET":
            case "HEAD":
                const isitasset = await this.giveme.resolve("isitasset");
                const isitget = await this.giveme.resolve("isitget");
                return isitasset.ask(pathname) || isitget.ask(pathname);
            case "POST":
                const isitpost = await this.giveme.resolve("isitpost");
                return isitpost.ask(pathname);
            case "DELETE":
                const isitdelete = await this.giveme.resolve("isitdelete");
                return isitdelete.ask(pathname);
            case "PUT":
                const isitput = await this.giveme.resolve("isitput");
                return isitput.ask(pathname);
            case "PATCH":
                const isitpatch = await this.giveme.resolve("isitpatch");
                return isitpatch.ask(pathname);
            case "OPTIONS":
                return await this.giveme.resolve("isoptions");

            default:
                throw new HttpError(405, { method, pathname });
        };
    };

    async invoke(context, stream, headers, flags) {
        try {
            let leaf = await this.leaf(context.method, context.pathname);
            if (!leaf) throw new HttpError(404);
            
            context.params = leaf.params;
            context.route = leaf.router;
            await leaf.router.invoke(context, stream, headers, flags);
        }
        catch(error) {
            stream.writeError(error);
        }
    }

    toString() {
		return `GET
${this.isitget}
POST
${this.isitpost}
PUT
${this.isitput}
PATCH
${this.isitpatch}
DELETE
${this.isitdelete}`;
	}
};

exports = module.exports = HttpRouter;
