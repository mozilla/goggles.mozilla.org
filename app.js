var express  = require("express"),
    goggles  = require("./lib/goggles"),
    habitat  = require("habitat"),
    nunjucks = require("nunjucks"),
    path     = require("path");

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    env = new habitat(),
    nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + "/views")));

// make it small.
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'webxray/static-files')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next) {
  console.log("error: ", err);
  res.render(500);
});

// Enable template rendering with nunjucks
nunjucksEnv.express(app);

app.param("filename", function(req, res, next, filename) {
  req.params.filename = filename;
  next();
})
app.get("/src/:filename", function(req, res) {
  res.render("./webxray/src/"+req.params.filename);
})

// run server
goggles.build(env, nunjucksEnv, function() {
  var port = (env.get("node") === "development" ? env.get("PORT") : 80);
  app.listen(port, function(){
    console.log('Express server listening on ' + env.get("HOSTNAME"));
  });
});
