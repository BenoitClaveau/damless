# DamLess

DamLess help you to create a NodeJS stream api (with http chunk).

Develop your http server like a gulp script. 

 [![NPM][npm-image]][npm-url]
 [![Build Status][travis-image]][travis-url]
 [![Coverage Status](https://coveralls.io/repos/github/BenoitClaveau/damless/badge.svg?branch=master)](https://coveralls.io/github/BenoitClaveau/damless?branch=master)
 [![NPM Download][npm-image-download]][npm-url]
 [![Dependencies Status][david-dm-image]][david-dm-url]


```server.js
const DamLess = require("damless");
const damless = new DamLess();
damless
    .config({ http: { port: 3000 }})
    .inject("info", "./services/info")
    .inject("user", "./services/user")
    .get("/helloworld", "info", "helloworld")
    .post("/user", "user", "insertOne")
    .start();
```

```./services/info.js
class Info {	
    // helloworld is declare as GET:/helloworld
    helloworld(context, stream, headers) {
        stream.write("Hello");
        stream.end("world");
    }
}
```

```./services/user.js
const { Transform } = require("stream");
class User {	
    insertOne(context, stream, headers) {
        // Read a JSON stream request and write a response as a JSON stream.
        stream
            .pipe(new Transform({
                objectMode: true,
                transform(chunk, enc, callback) {
                    // save the chunk (user) in the database
                    callback(null, chunk);
                }
            }))
            .pipe(stream);
    }
}
```

```shell
npm install damless --save
```


# Features
  
  [Dependency Injection](#di)

  [(context, stream, headers) like http2 interface](#ask-reply)


## Services/info.js <a href="#services" />

```services/info.js
class ServiceInfo {	
};

text(context, stream, headers) {
  stream.write("Hello");
  stream.end("world")
};

json(context, stream, headers) {
  stream.write({ name: "peter" });
  stream.end({ name: "folk" });
};

exports = module.exports = ServiceInfo;
```

## Dependency Injection <a href="#di" />

DamLess use [givemetheservice](https://www.npmjs.com/package/givemetheservice) to inject all services.

You can override all damless functions or inject your new services.

It's is easier to test your api.

## (context, stream, headers) -> http2 interface <a href="#ask-reply" />

DamLess has been inspired by the http2 syntax. The request and response are wrap by an unique duplex stream.
This stream automatically stringify, gzip or deflate your response. It is useless to pipe a compressor.

## Extend services <a href="#oop" />

Use the power of ES6 to easily extends services.

```json.js
const { Json } = require("damless");
const moment = require("moment");
const { ObjectID } = require("bson");

class CustomJson extends Json {

    constructor() {
        super();
    }

    // override the default onValue to deserialize mongo ObjectID
    onValue(key, value) {
        if (/\d{2}-\d{2}-\d{2}/.test(value)) return moment(value, "YYYY-MM-DD").toDate();
        if (ObjectID.isValid(value)) return new ObjectID(value);
        return super.onValue(key, value);
    }
}

exports = module.exports = CustomJson;
```

The default json serializer is declared in the DI as "json". Replace it to load your service.

```server.js
damless
    .inject("json", "./custom-json.js")
```

## Develop faster
  
  * [mongo](https://www.npmjs.com/package/damless-mongo)
  * [nodemailer](https://www.npmjs.com/package/damless-nodemailer)*

## Configuration manager (damless.json) <a href="#config" />

You can configure damless in javascript or via json file.

```server.js
damless
    .config("./damless.json")
    .config({ http: { port: 3000 }})
    .config(config => {
        config.env = "dev"
    })
```

```damless.json
{
    "services": "./services.json",
    "http": {
        "port": 3000
    }
}
```
You can declare your services in an other json file.

```services.json
{
    "services": [
        {
            "name": "info",
            "location": "./services/info"
        }
    ],
    "http-routes": [
        {
            "get": "/",
            "service": "info",
            "method": "text"
        }
    ]
}
```

Retrieve the config object in your service.

```.js
class ServiceInfo {
    // config will be injected by our DI
    constructor(config) {
        console.log(config.http.port);
    }
};
```

## You want to see some examples

To run our examples, clone the Damless repo and install the dependencies.

```bash
$ git clone https://github.com/BenoitClaveau/damless --depth 1
$ cd damless
$ npm install
$ cd exemples/helloworld
$ node server.js
```

## Test

To run our tests, clone the Damless repo and install the dependencies.

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
