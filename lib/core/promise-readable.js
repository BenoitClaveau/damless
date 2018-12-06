/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

getFirst = async (stream) => {
    let res = null;
    return await new Promise(async (resolve, reject) => {
        stream
            .once("data", data => {
                res = data;
            })
            .once("end", data => {
                if (!res && data) res = data;
                resolve(res);
            }).once("error", () => {
                resolve(null);
            });
    })
}

getAll = async (stream) => {
    const buffer = [];
    return await new Promise(async (resolve, reject) => {
        stream
            .on("data", data => {
                buffer.push(data);
            })
            .once("end", data => {
                if (data) buffer.push(data);
                resolve(buffer);
            }).once("error", () => {
                resolve([]);
            });
    })
}

getBuffer = async (stream) => {
    const data = await getAll(stream);
    return Buffer.concat(data);
}

ending = async (stream) => {
    return await new Promise(async (resolve, reject) => {
        stream
            .once("error", error => {
                reject(error);
            })
            .once("finish", () => {
                resolve();
            })
            .once("end", () => {
                resolve();
            })
            .resume();
    })
}

module.exports.getAll = getAll;
module.exports.getBuffer = getBuffer;
module.exports.getFirst = getFirst;
module.exports.ending = ending;