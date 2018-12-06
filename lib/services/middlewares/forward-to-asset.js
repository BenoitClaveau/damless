/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const { HttpError } = require("oups");

class ForwardToAssetMiddleware {

    constructor(giveme) {
        this.giveme = giveme;
    };

    async mount() {
        this.isitasset = await this.giveme.resolve("isitasset");
    }

    async invoke(context, stream, headers) {
        const {
            route: {
                options: {
                    forwardTo,
                    ...others
                }
            }
        } = context;

        if (!forwardTo) return;
        
        const asset = await this.isitasset.ask(forwardTo);
        if (!asset) 
            throw new HttpError(404, "Failed to forward to ${forwardTo}", { forwardTo });

        context.route.options = { ...others };
        await asset.router.invoke(context, stream, headers); // to set handeled and stop the workflow
        return true;
    }
}

module.exports = ForwardToAssetMiddleware;