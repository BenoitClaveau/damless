/*!
 * dambreaker
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const DamBreaker = require("../../index");
const request = require('request');
const fs = require('fs');

describe("post", () => {

    // it("post json", done => {
    //     let server = null;
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.post("/save", "info", "save");

    //         return giveme.load().then(() => {
    //             server = http.createServer((request, response) => {
    //                 return giveme.invoke(request, response).catch(error => {
    //                     return response.send({ statusCode: 500, request: request, content: error }); //close request
    //                 });
    //             }).listen(1337);
                
    //             let client = giveme.resolve("client");
    //             return client.post({ url: "http://localhost:1337/save", json: { login: "test" }}).then(res => {
    //                 expect(res.body.status).toBe("saved");
    //             });
    //         });
    //     }).catch(fail).then(() => {
    //         if (server) server.close();
    //         done();
    //     });
    // });

    // it("post form-data", done => {
    //     let server = null;
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.post("/save", "info", "save");

    //         return giveme.load().then(() => {
    //             server = http.createServer((request, response) => {
    //                 return giveme.invoke(request, response).catch(error => {
    //                     return response.send({ statusCode: 500, request: request, content: error }); //close request
    //                 });
    //             }).listen(1337);
                
    //             let client = giveme.resolve("client");
    //             return client.post({ url: "http://localhost:1337/save", formData: { 
    //                 login: "test",
    //                 file: fs.createReadStream(__dirname + '/../services/images/world.png'),
    //             }});
    //         });
    //     }).catch(fail).then(() => {
    //         if (server) server.close();
    //         done();
    //     });
    // });

    // it("post x-www-form-urlencoded", done => {
    //     let server = null;
    //     return Promise.resolve().then(() => {
    //         let giveme = new GiveMeTheService({ dirname: __dirname, config: {}});
            
    //         giveme.inject("info", "../services/info");
    //         giveme.post("/save", "info", "save");

    //         return giveme.load().then(() => {
    //             server = http.createServer((request, response) => {
    //                 return giveme.invoke(request, response).catch(error => {
    //                     return response.send({ statusCode: 500, request: request, content: error }); //close request
    //                 });
    //             }).listen(1337);
                
    //             let client = giveme.resolve("client");
    //             return client.post({ url: "http://localhost:1337/save", form: { login: "test" }});
    //         });
    //     }).catch(fail).then(() => {
    //         if (server) server.close();
    //         done();
    //     });
    // });
});
