

const DamLess = require('../../index');
new DamLess({ config: { http: { port: 1337 }}})
    .inject("app", "./applicationservice")
    .get("/", "app", "getHelloWorld")
    .start();