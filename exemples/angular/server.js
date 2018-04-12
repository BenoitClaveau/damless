

const DamBreaker = require('../../index');
const dambreaker = new DamBreaker({ config: { http: { port: 1337 }}});

await dambreaker.inject("app", "./applicationservice");
dambreaker.get("/", "app", "index");
dambreaker.get("/cities", "app", "cities"); 
dambreaker.post("/city", "app", "city"); 
dambreaker.post("/image", "app", "toJpeg"); 

await dambreaker.start();