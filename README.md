# DamBreaker

Streamify your web server.

```json
stream.write({ word: "Dam" });
stream.end({ word: "Less" });
```

DamBreaker is the first NodeJS web server dedicated to streamify all responses.

```shell
npm install dambreaker --save
```

 [![NPM][npm-image]][npm-url]
 [![Build Status][travis-image]][travis-url]
 [![Coverage Status][coveralls-image]][coveralls-url]
 [![NPM Download][npm-image-download]][npm-url]
 [![Dependencies Status][david-dm-image]][david-dm-url]

# Features

  * [Structured your project using services](#services).
  * [Dependency Injection to override default behavior](#di).
  * Compression & minification
  * 0 disk access at runtime
  * [Configuration](#config)
  * [Security](https://github.com/shieldfy/API-Security-Checklist)


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

Override core services to custom DamBreaker.

```services.json
{
  "services": [
    { "name": "service", "location": "./service"}
  ]
  "http-routes": [   
  ]
}
```

## DamBreaker Configuration <a href="#config" />

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


const DamBreaker = require("dambreaker");
const dambreaker = new Damless();
await dambreaker.start();
```

Run server on http://localhost:3000

## Use other DamBreaker services to develop as fast as a rocket
  
  * [$mongo](https://www.npmjs.com/package/dambreaker-mongo)
  * [$nodemailer](https://www.npmjs.com/package/dambreaker-nodemailer)
  * [$bitbucket](https://www.npmjs.com/package/dambreaker-bitbucket-deploy)
  * [$aws-s3](https://www.npmjs.com/package/dambreaker-aws-s3)
  * [$aws-ses](https://www.npmjs.com/package/dambreaker-aws-ses)
  * [aws api gateway](https://www.npmjs.com/package/dambreaker-aws-api-gateway)

## You want to see some examples

To run our examples, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/dambreaker --depth 1
$ cd dambreaker
$ npm install
$ cd exemples/helloworld
$ node server.js
```

## Test

To run our tests, clone the Qwebs repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/dambreaker --depth 1
$ cd dambreaker
$ npm install
$ cd tests
$ node.exe "../node_modules/mocha/bin/mocha" .
```

[npm-image]: https://img.shields.io/npm/v/dambreaker.svg
[npm-image-download]: https://img.shields.io/npm/dm/dambreaker.svg
[npm-url]: https://npmjs.org/package/dambreaker
[travis-image]: https://travis-ci.org/BenoitClaveau/dambreaker.svg?branch=master
[travis-url]: https://travis-ci.org/BenoitClaveau/dambreaker
[coveralls-image]: https://coveralls.io/repos/BenoitClaveau/dambreaker/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/BenoitClaveau/dambreaker?branch=master
[david-dm-image]: https://david-dm.org/BenoitClaveau/dambreaker/status.svg
[david-dm-url]: https://david-dm.org/BenoitClaveau/dambreaker
