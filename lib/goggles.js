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
        webxray = '';

    console.log("python compiling...");
    process.chdir("webxray");
    exec("python go.py compile", function(err,stdout,stderr) {
      process.chdir("..");
      console.log("node compiling...");

      // Once python had its go, generate our own version instead.
      // We can't generate the locale files yet in node, so we
      // still rely on python for the moment to back us up.
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
          // settings file needs to be our version, not
          // the predefined version from the webxray repo.
          if (filename === "./webxray/src/settings.js") {
            var settings = nunjucksEnv.getTemplate("settings.js");
            compiled.push(settings.render({
              hackpubURL: env.get("hackpuburl"),
              bugReportHackpubURL: env.get("bugreporthackpuburl")
            }));
          }
          // intro.js requires metadata instantiation
          else if (filename === "./webxray/src/intro.js") {
            var metadata = JSON.stringify({
                  date: Date(),
                  commit: "unknown"
                }),
                fileData = fs.readFileSync(filename).toString();
            compiled.push(fileData.replace("__BUILD_METADATA__", metadata));
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
    });
  }
};
