const express = require("express");
const serverless = require("serverless-http");
const logger = require("morgan");
const app = express();
const router = express.Router();
const apicache = require("apicache");
const func = require("./handler");
const responseTime = require("response-time");

let cache = apicache.middleware;

app
  .use(logger("dev"))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(cache("1 hour"))
  .use(responseTime());

router.get("*", func.processing);
router.get("/", func.processing);
router.get("/stats", func.cacheManager);

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
