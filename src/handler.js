const axios = require("axios");
const mcache = require("memory-cache");
const log = (...args) => console.log("→", ...args);

const validURL = str => {
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return pattern.test(str);
};

const isJson = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
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
    .then(response => {
      if (isJson(response.data)) {
        mcache.put(cacheKey, response.data, cacheTime * 1000);
        res.json(this.response(true, response.data));
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
