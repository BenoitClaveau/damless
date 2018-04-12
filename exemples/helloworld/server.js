

const DamBreaker = require('../../index');
const dambreaker = new DamBreaker({ config: { http: { port: 1337 }}});

await dambreaker.inject("app", "./applicationservice");
dambreaker.get("/", "app", "getHelloWorld");
await dambreaker.start();