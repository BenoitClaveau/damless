/*!
 * dam-less
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const DamLess = require("../../index");
const Options = require('../../lib/routes/options');

describe("options", () => {

    // it("*", done => {
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
    //         return giveme.load().then(() => {
    //             let router = giveme.resolve("router");
    //             let options = new Options(router);
                
    //             let request = new http.IncomingMessage();
    //             request.url = "*";
                
    //             let response = new http.ServerResponse(request);
                
    //             return options.invoke(request, response).then(res => {
    //                 expect(res.header.Allow).toBe("GET,POST,PUT,DELETE,HEAD,OPTIONS");
    //             });
    //         });
    //     }).catch(fail).then(done);
    // });

    // it("get", done => {
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.get("/get", "info", "getInfo");

    //         return giveme.load().then(() => {
    //             let router = giveme.resolve("router");
    //             let options = new Options(router);

    //             let request = new http.IncomingMessage();
    //             request.url = "/get";
    //             request.pathname = "/get";
                
    //             let response = new http.ServerResponse(request);
                
    //             return options.invoke(request, response).then(res => {
    //                 expect(res.header.Allow).toBe("GET");
    //             });
    //         });
    //     }).catch(fail).then(done);
    // });

    // it("post", done => {
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.post("/save", "info", "save");

    //         return giveme.load().then(() => {
    //             let router = giveme.resolve("router");
    //             let options = new Options(router);

    //             let request = new http.IncomingMessage();
    //             request.url = "/save";
    //             request.pathname = "/save";
                
    //             let response = new http.ServerResponse(request);
                
    //             return options.invoke(request, response).then(res => {
    //                 expect(res.header.Allow).toBe("POST");
    //             });
    //         });
    //     }).catch(fail).then(done);
    // });

    // it("put", done => {
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.put("/update", "info", "update");

    //         return giveme.load().then(() => {
    //             let router = giveme.resolve("router");
    //             let options = new Options(router);

    //             let request = new http.IncomingMessage();
    //             request.url = "/update";
    //             request.pathname = "/update";
                
    //             let response = new http.ServerResponse(request);
                
    //             return options.invoke(request, response).then(res => {
    //                 expect(res.header.Allow).toBe("PUT");
    //             });
    //         });
    //     }).catch(fail).then(done);
    // });

    // it("delete", done => {
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.delete("/delete", "info", "delete");

    //         return giveme.load().then(() => {
    //             let router = giveme.resolve("router");
    //             let options = new Options(router);

    //             let request = new http.IncomingMessage();
    //             request.url = "/delete";
    //             request.pathname = "/delete";
                
    //             let response = new http.ServerResponse(request);
                
    //             return options.invoke(request, response).then(res => {
    //                 expect(res.header.Allow).toBe("DELETE");
    //             });
    //         });
    //     }).catch(fail).then(done);
    // });
});