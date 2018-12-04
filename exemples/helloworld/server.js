

const DamLess = require('../../index');
new DamLess()
    .config({ config: { http: { port: 1337 }}})
    .inject("app", "./applicationservice")
    .get("/", "app", "getHelloWorld")
    .start();