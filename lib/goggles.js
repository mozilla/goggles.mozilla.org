module.exports = {
  build: function compileLibrary(env, nunjucksEnv, runWhenDone) {
    var exec = require("child_process").exec,
        fs = require("fs"),
        glob = require("glob");
        dir = "./webxray/",
        config = fs.readFileSync(dir + "config.json"),
        json = JSON.parse(config),
        compiledFileParts = json.compiledFileParts,
        compiled = [],
        webxray = '',
        overrides = ['uproot.js', 'input.js'];

    console.log("node compiling...");

    compiledFileParts.forEach(function(part) {
      var filenames = [];
      if (part.indexOf(".local.") > -1 && !fs.existsSync(part)) {
          return;
      }
      if (part.indexOf("*") > -1) {
        var dirContent = glob.sync(dir + part);
        filenames = filenames.concat(dirContent);
      } else { filenames.push(dir + part); }

      filenames.forEach(function(filename) {
        var pathless = filename.replace('./webxray/src/',''),
            fileData;

        // settings file needs to be our version, not
        // the predefined version from the webxray repo.
        if (pathless === "settings.js") {
          var settings = nunjucksEnv.getTemplate("settings.js");
          compiled.push(settings.render({
            hackpubURL: env.get("hackpuburl"),
            hostname: env.get("APP_HOSTNAME"),
            idwmoURL: env.get("ID_WMO_URL"),
            publishwmoURL: env.get("PUBLISH_WMO_URL")
          }));
        }
        // intro.js requires metadata instantiation
        else if (pathless === "intro.js") {
          var metadata = JSON.stringify({
                date: Date(),
                commit: "unknown"
              });
          fileData = fs.readFileSync(filename).toString();
          compiled.push(fileData.replace("__BUILD_METADATA__", metadata).replace("__HOSTNAME__", env.get("APP_HOSTNAME")));
        }
        else if (pathless === "localized.js") {
          fileData = String(fs.readFileSync(__dirname + "/../public/bower/webmaker-i18n/localized.js"));
          compiled.push(fileData);
        }
        // file that we have our own override for?
        else if (overrides.indexOf(pathless) !== -1) {
          fileData = fs.readFileSync("./lib/overrides/"+pathless).toString();
          compiled.push(fileData);
        }
        // normal file
        else {
          compiled.push(fs.readFileSync(filename));
        }
      });
    });
    webxray = compiled.join('');
    fs.writeFileSync("./public/webxray.js", webxray);
    console.log("finish compiling");

    runWhenDone();
  }
};
