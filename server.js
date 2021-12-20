require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dns = require("dns");
const mongoose = require("mongoose");
const shortId = require("shortid");
const app = express();

// Basic configuration
const port = process.env.PORT || 3000;

// Database connection
const db = async () =>
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

db().catch((err) => console.log(err));

// Declared schemas
const shortedUrlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
});

// Declared models
const ShortedUrl = mongoose.model("ShortedUrl", shortedUrlSchema);

// Declared methods
const createShortedUrl = (originalUrl, shortUrl) => {
  const shortedUrl = new ShortedUrl({
    originalUrl,
    shortUrl,
  });

  return shortedUrl.save();
};

const getUrlByShort = (shortUrl) => {
  return ShortedUrl.findOne({ shortUrl });
};

const getUrlByOrg = (originalUrl) => {
  return ShortedUrl.findOne({ originalUrl });
};

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

// Configure express to use bodyParser as middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post(
  "/api/shorturl",
  (req, res, next) => {
    // To access POST variable use req.body() methods
    const url = req.body.url;

    // Validate if url follow http://example.com format
    const testRegex = /^http(s*):\/\//;
    req.tested = testRegex.test(url);

    // Validate URL with dns.lookup
    const dnsRegex = /(\/+)/gi;
    req.evalUrl = req.body.url.replace(dnsRegex, "").replace("https:", "");

    next();
  },
  (req, res) => {
    const url = req.body.url;

    // Validate if url follow http://example.com format
    const tested = req.tested;

    if (!tested) {
      return res.json({ error: "invalid url" });
    }

    // Validate URL with dns.lookup
    const evalUrl = req.evalUrl;

    dns.lookup(
      evalUrl,
      // { family: 0, hints: dns.ADDRCONFIG | dns.V4MAPPED },
      async (err, addr, family) => {
        // Check if provided url is valid
        if (err !== null && addr === null) {
          return res.json({ error: "invalid url" });
        }

        // Check if url exist in db
        const itExist = await getUrlByOrg(url);

        if (itExist) {
          return res.json({
            original_url: itExist.originalUrl,
            short_url: itExist.shortUrl,
          });
        }

        // Create new shortUrl document
        const newUrl = shortId.generate();

        const data = await createShortedUrl(url, newUrl);

        res.json({
          original_url: data.originalUrl,
          short_url: data.shortUrl,
        });
      }
    );
  }
);
// 4jcxAij6J
app.get("/api/shorturl/:shorturl", async (req, res) => {
  const shortUrl = req.params.shorturl;
  const data = await getUrlByShort(shortUrl);

  if (!data) {
    return res.json({ error: "invalid url" });
  }

  res.redirect(data.originalUrl);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
