"use strict";

const DamLess = require('../../index');
const damless = new DamLess({ config: { http: { port: 1337 }}});

await damless.inject("app", "./applicationservice");
damless.get("/", "app", "getHelloWorld");

await damless.start();