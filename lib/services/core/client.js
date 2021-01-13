/*!
 * giveme
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const request = require('request');
const querystring = require("querystring");
const { HttpError } = require("oups");

class ClientService {
    constructor(json) {
        this.json = json;
    };

    createError(httpResponse) {
        let { statusCode, headers, body } = httpResponse;
        statusCode = statusCode || 500;
        if (/application\/json/.test(headers["content-type"]) && typeof body === "string") body = this.json.parse(body);
        if (body && body.message && body.stack)
           return new HttpError(statusCode, "statusCode: ${statusCode},\nmessage: ${message},\nstack: ${stack}", { statusCode, headers, message: body.message, stack: body.stack });
        if (body && body.message)
            return new HttpError(statusCode, "statusCode: ${statusCode},\nmessage: ${message}", { statusCode, headers, message: body.message });
        if (typeof body === "string") 
            return new HttpError(statusCode, `statusCode: ${statusCode},\nbody: ${body}`, { statusCode, headers, body });
        return new HttpError(statusCode, "statusCode: ${statusCode}", { statusCode, headers, body });
    }

    request(options = {}) {
        return new Promise((resolve, reject) => {
            request(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };

    get(options = {}) {
        return new Promise((resolve, reject) => {
            request.get(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };
 
    post(options = {}) {
        return new Promise((resolve, reject) => {
            request.post(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };
 
    put(options = {}) {
        return new Promise((resolve, reject) => {
            request.put(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };

    patch(options = {}) {
        return new Promise((resolve, reject) => {
            request.patch(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };
 
    delete(options = {}) {
        return new Promise((resolve, reject) => {
            request.delete(options, (err, httpResponse, body) => {
                if (err) reject(err);
                else if (httpResponse.statusCode < 200 || httpResponse.statusCode > 299) reject(this.createError(httpResponse));
                else resolve(httpResponse);
            });
        });
    };
};

exports = module.exports = ClientService;
