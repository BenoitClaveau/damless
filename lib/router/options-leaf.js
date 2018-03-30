/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { Leaf } = require("isitforme");
const Options = require("../routes/options");

class OptionsLeaf extends Leaf {
    constructor(qwebs) {
		super(new Options(qwebs));
	};
};

exports = module.exports = OptionsLeaf;