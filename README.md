# DamLess
 Streamify your web server.
 
 DamLess is the first NodeJs web server dedicated to streamify all responses.

 [![NPM][npm-image]][npm-url]
 [![Build Status][travis-image]][travis-url]
 [![Coverage Status][coveralls-image]][coveralls-url]
 [![NPM Download][npm-image-download]][npm-url]
 [![Dependencies Status][david-dm-image]][david-dm-url]

# Features

  * Every things is Stream.
  * Structured your project using services.
  * Dependency Injection to override default behavior.
  * [Object oriented programming (OOP)](#oop) 
  * [Compression & minification](#bundle) 
  * [0 disk access at runtime](#disk) 
  * [Configuration](#config)
  * [Security](https://github.com/shieldfy/API-Security-Checklist)

# Installation

```shell
npm install $damless --save
```

## Service.js

```service.js


class Service {	
};

text(context, stream, headers) {
 stream.write("Hello");
 stream.end("world")
};

json(context, stream, headers) {
  stream.write({ name: "peter" });
  stream.end({ name: "folk" });
};

exports = module.exports = Service;
```

## Dependency Injection

```services.json
{
  "services": [
    { "name": "service", "location": "./service"}
  ]
  "http-routes": [     
  ]
}
```

## Configuration damless.json

```config.json
{
    "services": "./services.json",
    "http": {
        "port": 3000
    }
}
```

## Enjoy

Create a server.js

```server.js


const DamLess = require("damless");
const damless = new Damless();
await damless.start();
```

Run server on http://localhost:3000

## Others Services
  
  * [$http](https://www.npmjs.com/package/damless)
  * [$https](https://www.npmjs.com/package/damless-https)
  * [$http-to-https](https://www.npmjs.com/package/damless-to-https)
  * [$mongo](https://www.npmjs.com/package/damless-mongo)
  * [$authentication](https://www.npmjs.com/package/damless-auth-jwt)
  * [$https](https://www.npmjs.com/package/damless-https)
  * [$nodemailer](https://www.npmjs.com/package/damless-nodemailer)
  * [$bitbucket](https://www.npmjs.com/package/damless-bitbucket-deploy)
  * [$aws-s3](https://www.npmjs.com/package/damless-aws-s3)
  * [$aws-ses](https://www.npmjs.com/package/damless-aws-ses)
  * [aws api gateway](https://www.npmjs.com/package/damless-aws-api-gateway)

## Examples

To run our examples, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/damless --depth 1
$ cd damless
$ npm install
$ cd exemples/helloworld
$ node server.js
```

## Test

To run our tests, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/damless --depth 1
$ cd damless
$ npm install
$ cd tests
$ node.exe "../node_modules/mocha/bin/mocha" .
```

[npm-image]: https://img.shields.io/npm/v/damless.svg
[npm-image-download]: https://img.shields.io/npm/dm/damless.svg
[npm-url]: https://npmjs.org/package/damless
[travis-image]: https://travis-ci.org/BenoitClaveau/damless.svg?branch=master
[travis-url]: https://travis-ci.org/BenoitClaveau/damless
[coveralls-image]: https://coveralls.io/repos/BenoitClaveau/damless/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/BenoitClaveau/damless?branch=master
[david-dm-image]: https://david-dm.org/BenoitClaveau/damless/status.svg
[david-dm-url]: https://david-dm.org/BenoitClaveau/damless
