const axios = require("axios");
const mcache = require("memory-cache");
const log = (...args) => console.log("→", ...args);

const validURL = str => {
  regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  if (regexp.test(str)) {
    return true;
  } else {
    return false;
  }
};

exports.response = (err = false, msg = "ok", shortURL) => {
  const response = {
    url: shortURL,
    message: msg,
    error: err
  };
  return response;
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

  const cacheKey = `__transient__${parsedUrl}`;
  const cacheTime = req.query.cache || 86400;
  const cachedBody = mcache.get(cacheKey);

  //  return cached data
  if (cachedBody && cacheTime !== "0") {
    res.status(304);
    log("📦", ` Cache response ${parsedUrl}`);
    res.send(this.response(true, cachedBody));
    return;
  }

  axios(parsedUrl)
    .then(res => {
      mcache.put(cacheKey, json, cacheTime * 1000);
      res.json(this.response(true, res.data));
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
