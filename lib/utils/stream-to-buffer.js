/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

/* exemple
return stream.pipe(new ToBuffer()).then(items => {
    expect(item.length).to.be(0);
});
*/

const StreamToArray = require("./stream-to-array");

class StreamToBuffer extends StreamToArray {
    constructor() {
        super();
    };

    onFinish(resolve, reject) {
        resolve(Buffer.concat(this._data));
    };
};

exports = module.exports = StreamToBuffer;