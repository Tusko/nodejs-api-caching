const express = require("express");
const serverless = require("serverless-http");
const logger = require("morgan");
const app = express();
const router = express.Router();
const func = require("./handler");
const responseTime = require("response-time");
const cors = require("cors");

app
  .use(cors())
  .use(logger("dev"))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(responseTime());

// router.get("*", func.processing);
router.get("/", func.processing);
router.get("/stats", func.cacheManager);

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
