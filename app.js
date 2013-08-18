// New Relic Server monitoring support
if ( process.env.NEW_RELIC_ENABLED ) {
  require( "newrelic" );
}
var bleach = require( "./lib/bleach"),
    db = require('./lib/database'),
    express    = require("express"),
    goggles    = require("./lib/goggles"),
    habitat    = require("habitat"),
    helmet = require("helmet"),
    makeAPI = require('./lib/makeapi'),
    nunjucks   = require("nunjucks"),
    path       = require("path"),
    utils = require('./lib/utils'),
    version = require('./package').version,
    i18n = require( "webmaker-i18n" );

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    appName = "goggles",
    env = new habitat(),
    node_env = env.get('NODE_ENV'),
    databaseOptions =  env.get('CLEARDB_DATABASE_URL') || env.get('DB'),
    databaseAPI = db('thimbleproject', databaseOptions),
    middleware = require('./lib/middleware')(env),
    make = makeAPI(env.get('make')),
    nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('views'), {
      autoescape: true
    }),
    parameters = require('./lib/parameters');

// Enable template rendering with nunjucks
nunjucksEnv.express(app);

// NOTE: currently not used!
app.locals({
  GA_ACCOUNT: env.get("GA_ACCOUNT"),
  GA_DOMAIN: env.get("GA_DOMAIN"),
  hostname: env.get("hostname")
});

app.use(i18n.middleware({
  supported_languages: [
    'en-US'
  ],
  default_lang: 'en-US',
  translation_directory: path.join( __dirname, 'locale' )
}));

app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
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
app.use(function(err, req, res, next) {
  // universal error handler
  console.error(err.msg);
  throw err;
});

// Save an x-ray goggles mix to the DB.
// FIXME: this happens before CRSF is applied, and will
//        need some thinking. As a bookmarklet, there will
//        not be a CSRF token to pass around... will there?
app.post('/publish',
         middleware.checkForAuth,
         middleware.checkForPublishData,
         middleware.ensureMetaData,
         middleware.sanitizeMetaData,
         middleware.checkPageOperation(databaseAPI),
         bleach.bleachData(env.get("BLEACH_ENDPOINT")),
         middleware.saveData(databaseAPI, env.get('HOSTNAME')),
         middleware.rewritePublishId(databaseAPI),
         middleware.generateUrls(appName, env.get('S3'), env.get('USER_SUBDOMAIN')),
         middleware.finalizeProject(nunjucksEnv, env),
         middleware.publishData(env.get('S3')),
         middleware.rewriteUrl,
         // update the database now that we have a S3-published URL
         middleware.saveUrl(databaseAPI, env.get('HOSTNAME')),
         middleware.getRemixedFrom(databaseAPI, make),
         middleware.publishMake(make),
  function(req, res) {
    res.json({
      'published-url': req.publishedUrl,
      'remix-id': req.publishId
    });
  }
);

// DEVOPS - Healthcheck
app.get('/healthcheck', function(req, res) {
  res.json({
    http: "okay",
    version: version
  });
});

// enable CSRF
app.use(express.csrf());

// intercept webxray's index - HTML part
app.get(["/", "/index.html"], function(req, res) {
  res.render("index.html", {
    audience: env.get("audience"),
    csrf: req.session._csrf || "",
    email: req.session.email || "",
    host: env.get("hostname"),
    login: env.get("login")
  });
});

// intercept webxray's publication dialog - HTML part
app.get("/uproot-dialog.html", function(req, res) {
  res.render("uproot-dialog.html", {
    audience: env.get("audience"),
    csrf: req.session._csrf || "",
    email: req.session.email || "",
    login: env.get("login")
  });
});

// intercept webxray's publication dialog - JS part
app.get("/publication.js", function(req, res) {
  res.render("publication.js", {
    audience: env.get("audience"),
    csrf: req.session._csrf || "",
    email: req.session.email || "",
    login: env.get("login")
  });
});


// serve static content, resolved in this order:
app.use(express.static(path.join(__dirname, "public")));
app.use( "/bower", express.static( path.join(__dirname, "bower_components" )));
app.use(express.static(path.join(__dirname, "webxray/static-files")));
["src", "test", "js"].forEach(function(dir) {
  app.use("/" + dir, express.static(path.join(__dirname, "webxray/" + dir)));
});

// viewing goggle hacks
app.param("remix", function(req, res, next, id) {
  databaseAPI.find(id, function(err, result) {
    if (err) { return next( err ); }
    if (!result) { return next(404, "project not Found"); }
    res.result = result;
    next();
  });
});
app.get("/remix/:remix", function(req, res) {
  res.write(res.result.rawData);
  res.end();
});

// Localized Strings
app.get("/strings/:lang?", function( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.jsonp(i18n.getStrings(req.params.lang || req.lang || "en-US"));
});

// override some path
app.get("/easy-remix-dialog/index.html", function(req, res) {
  res.render("/easy-remix-dialog/index.html");
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
