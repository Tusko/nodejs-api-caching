const axios = require("axios");
const mcache = require("memory-cache");
const log = (...args) => console.log("→", ...args);

const validURL = str => {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + //port
    "(\\?[;&amp;a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return pattern.test(str);
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
      mcache.put(cacheKey, res.data, cacheTime * 1000);
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
