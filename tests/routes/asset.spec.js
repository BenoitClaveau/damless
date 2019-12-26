/*!
 * damless
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const expect = require("expect.js");
const DamLess = require("../../index");
const request = require("request");
const fs = require("fs");
const JSONStream = require("JSONStream");

// describe("asset", () => {

//     it("create", done => {
//         return Promise.resolve().then(() => {
//             let giveme = new GiveMeTheService({ dirname: __dirname, config: { folder: false }});
//             return giveme.load().then(() => {
//                 let config = giveme.resolve("config");
//                 let router = giveme.resolve("http-router");
                
//                 let asset = new Asset(giveme, config, "/api", "text/css");
//             });
//         }).then(done);
//     });
    
//     it("create empty route", done => {
//         return Promise.resolve().then(() => {
//             let giveme = new GiveMeTheService({ dirname: __dirname, config: { folder: false }});
//             return giveme.load().then(() => {
//                 let config = giveme.resolve("config");
//                 let router = giveme.resolve("router");
                
//                 let asset = new Asset(giveme, config, null);
//             });
//         }).catch(error => {
//             expect(error.message).toEqual("Route is not defined.");
//         }).then(done);
//     });
    
//     it("invoke", done => {
//         return Promise.resolve().then(() => {
//             let giveme = new GiveMeTheService({ dirname: __dirname, config: { folder: false }});
//             return giveme.load().then(() => {
//                 let config = giveme.resolve("config");
//                 let router = giveme.resolve("router");
                
//                 let asset = new Asset(giveme, config, "/api", "text/css");
                
//                 let request = new http.IncomingMessage();
//                 request.url = "/api";
//                 request.pathname = "/api";
//                 request.method = "GET";
//                 let response = new http.ServerResponse(request);
                
//                 return asset.invoke(request, response);
//             });
//         }).then(data => {
//             expect(data).not.toBeNull();
//         }).catch(error => {
//             expect(error.message).toEqual("Content is empty"); //TODO
//         }).then(done);
//     });
    
//     it("bundle css", done => {
//         return Promise.resolve().then(() => {
//             let giveme = new GiveMeTheService({ dirname: __dirname, config: { folder: "public" }});
//             let config = giveme.resolve("config");
//             let router = giveme.resolve("router");
            
//             let asset = new Asset(giveme, config, "app.css");
//             return asset.initFromFiles(["../loaders/web/components.css", "../loaders/web/master.css"]);
//         }).then(asset => {
//             expect(asset.route).toEqual("app.css");
//             expect(asset.contentType).toEqual("text/css");
//             expect(asset.content).not.toBeNull();
//             expect(asset.contentDeflate).not.toBeNull();
//             expect(asset.contentGzip).not.toBeNull();
//         }).then(done);
//     });
    
//     it("bundle js", done => {
//         return Promise.resolve().then(() => {
//             let giveme = new GiveMeTheService({ dirname: __dirname, config: { folder: "public" }});
//             let config = giveme.resolve("config");
//             let router = giveme.resolve("router");
            
//             let asset = new Asset(giveme, config, "app.js");
//             return asset.initFromFile("../loaders/web/controller.js");
//         }).then(asset => {
//             expect(asset.route).toEqual("app.js");
//             expect(asset.contentType).toEqual("application/javascript");
//             expect(asset.content).not.toBeNull();
//             expect(asset.contentDeflate).not.toBeNull();
//             expect(asset.contentGzip).not.toBeNull();
//         }).then(done);
//     });
// });