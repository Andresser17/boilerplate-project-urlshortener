require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dns = require("dns");
const app = express();

const createdURLS = {
  // example: "https://google.com",
};

// Basic Configuration
const port = process.env.PORT || 3000;

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

app.post("/api/shorturl", (req, res, next) => {
  // To access POST variable use req.body() methods
  const url = req.body.url;

  // Validate if url follow http://example.com format
  const testRegex = /^http(s*):\/\//;
  const tested = testRegex.test(url);

  if (!tested) {
    return res.json({ error: "invalid url" });
  }

  // Validate URL with dns.lookup
  const dnsRegex = /(\/+)/gi;
  const evalURL = req.body.url.replace(dnsRegex, "").replace("https:", "");

  dns.lookup(
    evalURL,
    // { family: 0, hints: dns.ADDRCONFIG | dns.V4MAPPED },
    (err, addr, family) => {
      if (err === null && addr !== null) {
        // Get key for new key:value pair
        const newKey = Object.keys(createdURLS).length + 1;

        createdURLS[newKey] = url;

        res.json({ original_url: url, short_url: newKey });
      } else {
        res.json({ error: "invalid url" });
      }
    }
  );
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  const shorturl = req.params.shorturl;

  res.redirect(createdURLS[shorturl]);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
