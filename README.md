# DamLess

Streamify your web server.

```.js
stream.write("Hello");
stream.end("world")
```

DamLess has been designed to think the web as a stream. 

```shell
npm install damless --save
```

 [![NPM][npm-image]][npm-url]
 [![Build Status][travis-image]][travis-url]
 [![Coverage Status][coveralls-image]][coveralls-url]
 [![NPM Download][npm-image-download]][npm-url]
 [![Dependencies Status][david-dm-image]][david-dm-url]

# Features

  [Structured your project using services](#services)
  
  [Dependency Injection to override default behavior](#di)
  
  Compression & minification
  
  0 disk access at runtime
  
  [Configuration](#config)
  
  [Security](https://github.com/shieldfy/API-Security-Checklist)


## Service.js <a href="#services" />

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

## Dependency Injection <a href="#di" />

Inject your service and define a new http route.

Override core services to custom DamLess.

```services.json
{
  "services": [
    { "name": "service", "location": "./service"}
  ]
  "http-routes": [   
  ]
}
```

## DamLess Configuration <a href="#config" />

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

## Use other DamLess services to develop as fast as a rocket
  
  * [mongo](https://www.npmjs.com/package/damless-mongo)
  * [nodemailer](https://www.npmjs.com/package/damless-nodemailer)

## You want to see some examples

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
