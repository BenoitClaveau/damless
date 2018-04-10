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
npm install $dam-less --save
```

## Service.js

```service.js
"use strict";

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
"use strict";

const DamLess = require("damless");
const damless = new Damless();
await damless.start();
```

Run server on http://localhost:3000

## Others Services
  
  * [$http](https://www.npmjs.com/package/dam-less)
  * [$https](https://www.npmjs.com/package/qwebs-https)
  * [$http-to-https](https://www.npmjs.com/package/dam-less-to-https)
  * [$mongo](https://www.npmjs.com/package/qwebs-mongo)
  * [$authentication](https://www.npmjs.com/package/qwebs-auth-jwt)
  * [$https](https://www.npmjs.com/package/qwebs-https)
  * [$nodemailer](https://www.npmjs.com/package/qwebs-nodemailer)
  * [$bitbucket](https://www.npmjs.com/package/qwebs-bitbucket-deploy)
  * [$aws-s3](https://www.npmjs.com/package/qwebs-aws-s3)
  * [$aws-ses](https://www.npmjs.com/package/qwebs-aws-ses)
  * [aws api gateway](https://www.npmjs.com/package/qwebs-aws-api-gateway)

## Examples

To run our examples, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/qwebs --depth 1
$ cd qwebs
$ npm install
$ cd exemples/helloworld
$ node server.js
```

## Test

To run our tests, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/qwebs --depth 1
$ cd qwebs
$ npm install
$ cd tests
$ node.exe "../node_modules/mocha/bin/mocha" .
```

[npm-image]: https://img.shields.io/npm/v/qwebs.svg
[npm-image-download]: https://img.shields.io/npm/dm/qwebs.svg
[npm-url]: https://npmjs.org/package/qwebs
[travis-image]: https://travis-ci.org/BenoitClaveau/qwebs.svg?branch=master
[travis-url]: https://travis-ci.org/BenoitClaveau/qwebs
[coveralls-image]: https://coveralls.io/repos/BenoitClaveau/qwebs/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/BenoitClaveau/qwebs?branch=master
[david-dm-image]: https://david-dm.org/BenoitClaveau/qwebs/status.svg
[david-dm-url]: https://david-dm.org/BenoitClaveau/qwebs
