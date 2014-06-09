// New Relic Server monitoring support
var newrelic;
if ( process.env.NEW_RELIC_ENABLED ) {
  newrelic = require( "newrelic" );
} else {
  newrelic = {
    getBrowserTimingHeader: function () {
      return "<!-- New Relic RUM disabled -->";
    }
  };
}

var bleach = require("./lib/bleach"),
    db = require("./lib/database"),
    express    = require("express"),
    goggles    = require("./lib/goggles"),
    habitat    = require("habitat"),
    helmet = require("helmet"),
    i18n = require("webmaker-i18n"),
    lessMiddleWare = require("less-middleware"),
    makeAPI = require("./lib/makeapi"),
    nunjucks   = require("nunjucks"),
    path       = require("path"),
    utils = require("./lib/utils"),
    version = require("./package").version,
    WebmakerAuth = require("webmaker-auth"),
    wts = require("webmaker-translation-stats"),
    WWW_ROOT = path.resolve(__dirname, 'public');

// Load config from ".env"
habitat.load();

// Generate app variables
var app = express(),
    appName = "goggles",
    env = new habitat(),
    node_env = env.get('NODE_ENV'),
    databaseOptions =  env.get('CLEARDB_DATABASE_URL') || env.get('DB'),
    databaseAPI = db('thimbleproject', databaseOptions),
    emulate_s3 = env.get('S3_EMULATION') || !env.get('S3_KEY'),
    middleware = require('./lib/middleware')(env),
    make = makeAPI(env.get('make')),
    nunjucksEnv = new nunjucks.Environment([
      new nunjucks.FileSystemLoader(path.join(__dirname, 'views')),
      new nunjucks.FileSystemLoader(path.join(__dirname, 'public/bower'))
    ], {
      autoescape: true
    }),
    parameters = require('./lib/parameters'),
    webmakerAuth = new WebmakerAuth({
      loginURL: env.get("LOGINAPI"),
      secretKey: env.get("SESSION_SECRET"),
      domain: env.get("COOKIE_DOMAIN"),
      forceSSL: env.get("FORCE_SSL")
    });

// Enable template rendering with nunjucks
nunjucksEnv.express(app);
nunjucksEnv.addFilter( "instantiate", function( input ) {
    var tmpl = new nunjucks.Template( input );
    return tmpl.render( this.getVariables() );
});

// Content Security Policy (CSP)
var csp = middleware.addCSP({personaHost: env.get('PERSONA_HOST')});

app.disable("x-powered-by");


// log either to GELF or console
if (env.get("ENABLE_GELF_LOGS")) {
  messina = require("messina");
  logger = messina("goggles.webmaker.org-" + env.get("NODE_ENV") || "development" );
  logger.init();
  app.use(logger.middleware());
} else {
  app.use(express.logger("dev"));
}

app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
if (!!env.get("FORCE_SSL") ) {
  app.use(helmet.hsts());
  app.enable("trust proxy");
}
app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());

app.use(webmakerAuth.cookieParser());
app.use(webmakerAuth.cookieSession());

// Setup locales with i18n
app.use( i18n.middleware({
  supported_languages: env.get("SUPPORTED_LANGS"),
  default_lang: "en-US",
  mappings: require("webmaker-locale-mapping"),
  translation_directory: path.resolve( __dirname, "locale" )
}));

app.use(require("xfo-whitelist")([
  "/easy-remix-dialog/index.html",
  "/easy-remix-dialog/blank.html",
  "/preferences.html",
  "/uproot-dialog.html"
]));

i18n.addLocaleObject({
  "en-US": require("./public/bower/webmaker-auth-client/locale/en_US/create-user-form.json")
}, function (err, res) {
  if (err) {
    console.error(err);
  }
});

app.locals({
  GA_ACCOUNT: env.get("GA_ACCOUNT"),
  GA_DOMAIN: env.get("GA_DOMAIN"),
  hostname: env.get("APP_HOSTNAME"),
  languages: i18n.getSupportLanguages(),
  newrelic: newrelic,
  bower_path: "public/bower"
});

app.use(express.csrf());
app.use(function(err, req, res, next) {
  // universal error handler
  console.error(err.msg);
  throw err;
});

app.post('/publish',
         middleware.checkForAuth,
         middleware.checkForPublishData,
         middleware.ensureMetaData,
         middleware.sanitizeMetaData,
         middleware.checkPageOperation(databaseAPI),
         bleach.bleachData(env.get("BLEACH_ENDPOINT")),
         middleware.saveData(databaseAPI, env.get('APP_HOSTNAME')),
         middleware.rewritePublishId(databaseAPI),
         middleware.generateUrls(appName, env.get('S3'), env.get('USER_SUBDOMAIN')),
         middleware.finalizeProject(nunjucksEnv, env),
         middleware.publishData(env.get('S3')),
         middleware.rewriteUrl,
         // update the database now that we have a S3-published URL
         middleware.saveUrl(databaseAPI, env.get('APP_HOSTNAME')),
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
  var healthcheckObject = {
    http: "okay",
    version: version
  };
  wts(i18n.getSupportLanguages(), path.join(__dirname, "locale"), function(err, data) {
    if(err) {
      healthcheckObject.locales = err.toString();
    } else {
      healthcheckObject.locales = data;
    }
    res.json(healthcheckObject);
  });
});

app.get("/", function(req, res) {
  res.render("index.html", {
    audience: env.get("audience"),
    csrf: req.csrfToken(),
    email: req.session.email || "",
    host: env.get("APP_HOSTNAME"),
    personaHost: env.get("PERSONA_HOST")
  });
});

// Redirect this route to "/" to be safe if anyone is still using it.
// 2014/02/08 we have removed route to /index.html in this #Bug973991
app.get("/index.html", function(req, res) {
  res.redirect(301, "/");
});

// intercept webxray's publication dialog - HTML part
app.get("/uproot-dialog.html", csp, function(req, res) {
  res.render("uproot-dialog.html", {
    audience: env.get("audience"),
    csrf: req.csrfToken(),
    email: req.session.email || "",
    personaHost: env.get("PERSONA_HOST")
  });
});

// intercept webxray's publication dialog - JS part
app.get("/publication.js", function(req, res) {
  res.set( "Content-Type", "application/javascript; charset=utf-8" );
  res.render("publication.js", {
    audience: env.get("audience"),
    csrf: req.csrfToken(),
    email: req.session.email || ""
  });
});

var optimize = (node_env !== "development"),
    tmpDir = path.join( require("os").tmpDir(), "mozilla.webmaker.org");

app.use(lessMiddleWare({
  once: optimize,
  debug: !optimize,
  dest: tmpDir,
  src: WWW_ROOT,
  compress: true,
  yuicompress: optimize,
  optimization: optimize ? 0 : 2
}));

// serve static content, resolved in this order:
app.use(express.static(tmpDir));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "webxray/static-files")));
["src", "test", "js"].forEach(function(dir) {
  app.use("/" + dir, express.static(path.join(__dirname, "webxray/" + dir)));
});

// Localized Strings
app.get("/strings/:lang?", function( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.jsonp(i18n.getStrings(req.params.lang || req.localeInfo.lang || "en-US"));
});

// override some path
app.get("/easy-remix-dialog/index.html", function(req, res) {
  res.render("/easy-remix-dialog/index.html");
});

// SSO
app.post('/verify', webmakerAuth.handlers.verify);
app.post('/authenticate', webmakerAuth.handlers.authenticate);
app.post('/create', webmakerAuth.handlers.create);
app.post('/logout', webmakerAuth.handlers.logout);
app.post('/check-username', webmakerAuth.handlers.exists);

// build webxray and then run the app server
goggles.build(env, nunjucksEnv, function() {
  app.listen(env.get("port"), function(){
    console.log('Express server listening on ' + env.get("APP_HOSTNAME"));
  });

  // If we're in running in emulated S3 mode, run a mini
  // server for serving up the "s3" published content.
  if (emulate_s3) {
    require("mox-server").runServer(env.get("MOX_PORT", 12319));
  }
});
