/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

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
                    forward
                }
            }
        } = context;

        if (forward) {
            if (forward.asset) {
                const asset = await this.isitasset.ask(forward.asset);
                return await asset.router.invoke(context, stream, headers) || true; // to set handeled and stop the workflow
            }
            else throw new Error("NotSupported");
        }
    }
}

module.exports = ForwardToAssetMiddleware;