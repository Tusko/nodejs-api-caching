const express = require("express");
const logger = require("morgan");
const app = express();
const apicache = require("apicache");
const port = process.env.PORT || 3000;
const func = require("./functions.js");

let cache = apicache.middleware;

app
  .use(logger("dev"))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(cache("1 day"));

app.get("/", func.processing);
app.get("/list", func.cacheManager);

app.listen(port, () =>
  console.log(`app listening on http://localhost:${port}`)
);

module.exports = app;
