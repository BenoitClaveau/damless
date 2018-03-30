"use strict";

const DamLess = require('../../index');
const damless = new DamLess({ config: { http: { port: 1337 }}});

await damless.inject("app", "./applicationservice");
damless.get("/", "app", "index");
damless.get("/cities", "app", "cities"); 
damless.post("/city", "app", "city"); 
damless.post("/image", "app", "toJpeg"); 

await damless.start();