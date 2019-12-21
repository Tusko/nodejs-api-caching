const axios = require("axios");
const mcache = require("memory-cache");
const _ = require("lodash");
const log = (...args) => console.log("→", ...args);
const md5 = require("md5");

const validURL = str => {
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return pattern.test(str);
};

exports.response = (err = false, msg = "ok", data) => {
  return {
    message: msg,
    error: err,
    data: data
  };
};
exports.processing = (req, res) => {
  const parsedUrl = decodeURIComponent(req._parsedUrl.href.split("/?url=")[1]);

  if (!req.query.url) {
    log("📦", ` URL is empty`);
    res.status(500);
    res.send(this.response(true, "Please provide URL"));
    return;
  }

  if (!validURL(parsedUrl)) {
    log("📦", ` Not valid URL: ${parsedUrl}`);
    res.status(500);
    res.send(this.response(true, `Not valid URL: ${parsedUrl}`));
    return;
  }

  const cacheKey = md5(`__transient__${parsedUrl}`);
  const cacheTime = req.query.cache || 86400;
  const cachedBody = mcache.get(cacheKey);

  res.set("X-Md5-key", cacheKey);

  //  return cached data
  if (cachedBody && cacheTime !== "0") {
    res.status(304);
    log("📦", ` Cache response ${parsedUrl}`);
    res.send(this.response(true, cachedBody));
    return;
  }

  axios(parsedUrl)
    .then(response => {
      const resObject = response.data;
      const time = cacheTime * 1000;
      if (_.isObject(resObject)) {
        mcache.put(cacheKey, resObject, time);
        res.json(
          this.response(
            false,
            `Cached for ${cacheTime / 3600} hours`,
            resObject
          )
        );
      } else {
        res.json(this.response(true, `Can't parse JSON from external API`));
      }
    })
    .catch(e => res.json(this.response(true, e.message)));
};

exports.cacheManager = (req, res) => {
  log("📦", ` Loading cache items`);
  res.json(
    this.response(false, {
      memory: {
        items: mcache.keys(),
        size: mcache.memsize()
      }
    })
  );
};
