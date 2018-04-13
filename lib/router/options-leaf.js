/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { Leaf } = require("isitforme");
const Options = require("../routes/options");

class OptionsLeaf extends Leaf {
    constructor(giveme) {
		super(new Options(giveme));
	};
};

exports = module.exports = OptionsLeaf;