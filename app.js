var db = require('./lib/database'),
    express    = require("express"),
    goggles    = require("./lib/goggles"),
    habitat    = require("habitat"),
    nunjucks   = require("nunjucks"),
    path       = require("path");

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    appName = "goggles",
    env = new habitat(),
    middleware = require("./lib/middleware")(env),
    databaseOptions = env.get('CLEARDB_DATABASE_URL') || env.get('DB'),
    databaseAPI = db('xraygogglemix', databaseOptions),
    nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + "/views")));

// Enable template rendering with nunjucks
nunjucksEnv.express(app);

// make it small.
app.use(express.favicon());
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.cookieSession({
  key: "goggles.sid",
  secret: env.get("SESSION_SECRET"),
  cookie: {
    maxAge: 2678400000, // 31 days. Persona saves session data for 1 month
    secure: !!env.get("FORCE_SSL")
  },
  proxy: true
}));

// Save an x-ray goggles mix to the DB.
// FIXME: this happens before CRSF is applied, and will
//        need some thinking. As a bookmarklet, there will
//        not be a CSRF token to pass around... will there?
app.post('/publish',
  middleware.saveData(databaseAPI, env.get('HOSTNAME')),
  function(req, res) {
    res.json({
      'published-url': req.publishedUrl,
      'remix-id': req.publishId
    });
  }
);

// universal error handler
app.use(function(err, req, res, next) {
  res.write(500, err);
});

// enable CSRF
app.use(express.csrf());


// intercept webxray's index.html and use our own
app.get("/", function(req, res) {
  res.render("index.html", {
    appName: appName,
    audience: env.get("audience"),
    csrf: req.session._csrf || "",
    email: req.session.email || "",
    login: env.get("login")
  });
});


// serve static content, resolved in this order:
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "webxray/static-files")));
["src", "test", "js"].forEach(function(dir) {
  app.use("/" + dir, express.static(path.join(__dirname, "webxray/" + dir)));
});

// viewing goggle hacks
app.param("hack", function(req, res, next, id) {
  databaseAPI.find(id, function(err, result) {
    if (err) { return next( err ); }
    if (!result) { return next(404, "project not Found"); }
    res.locals.id = id;
    res.locals.data = result.data;
    res.locals.remixedFrom = result.remixedFrom;
    next();
  });
});
app.get("/remix/:hack", function(req, res) {
  res.write(res.locals.data);
});

// login API connections
require('webmaker-loginapi')(app, {
  loginURL: env.get('LOGINAPI'),
  audience: env.get('AUDIENCE')
});

// build webxray and then run the app server
goggles.build(env, nunjucksEnv, function() {
  app.listen(env.get("port"), function(){
    console.log('Express server listening on ' + env.get("hostname"));
  });
});
