

const DamLess = require('../../index');
new DamLess({ config: { http: { port: 1337 }}})
    .inject("app", "./applicationservice")
    .get("/", "app", "index")
    .get("/cities", "app", "cities")
    .post("/city", "app", "city")
    .post("/image", "app", "toJpeg")
    .start();