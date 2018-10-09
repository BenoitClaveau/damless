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

ending = async (stream) => {
    return await new Promise(async (resolve, reject) => {
        stream
            .once("end", () => {
                resolve();
            })
            .once("finish", () => {
                resolve();
            })
            .once("error", error => {
                reject(error);
            })
            .resume();
    })
}

module.exports.getAll = getAll;
module.exports.getFirst = getFirst;
module.exports.ending = ending;