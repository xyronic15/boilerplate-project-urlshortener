require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const bodyParser = require("body-parser");
const Schema = mongoose.Schema;

// set up the body parser middleware
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

// Connect to mongoose and prep the schema obj
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to database.");
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// prepare the urlSchema and url model
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

// API post endpoint for shorturl submision
app.post("/api/shorturl", (req, res) => {
  url = req.body.url;
  original = null;

  // check if the url passed is valid
  try {
    original = new URL(url);
    console.log(original)
    if (original.protocol !== "http:" && original.protocol !== "https:"){
      res.json({ error: "invalid url" });
    }
    original = original.href;
  } catch (err) {
    res.json({ error: "invalid url" });
  }

  let curr_short = 1;

  Url.findOne({})
    .sort({ short_url: -1 })
    .exec((err, data) => {
      // update the curr_short by finding the entry with the highest
      if (!err && data != undefined) {
        curr_short = data.short_url + 1;
      }

      // check if url exists and add new if not
      if (!err) {
        Url.findOneAndUpdate(
          { original_url: original },
          { original_url: original, short_url: curr_short },
          { new: true, upsert: true },
          (err, result) => {
            if (err) {
              console.log(err);
            }
            res.json({
              original_url: result.original_url,
              short_url: result.short_url,
            });
          }
        );
      }
    });
});

// API get endpoint for shorturl
app.get("/api/shorturl/:short_url", (req, res) => {
  const short_url = req.params.short_url

  Url.findOne({short_url: short_url}, (err, result) => {
    if (!err && result !== undefined){
      res.redirect(result.original_url)
    } else{
      res.json('URL not found')
    }
  })
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
