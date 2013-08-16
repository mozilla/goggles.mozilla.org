(function() {
  QUnit.config.autostart = false;

  var $ = fullJQuery;

  window.jQuery = {};

  window.htmlFixture = function(name) {
    var id = "#" + name;
    return {
      setup: function() {
        var url = "unit/" + name + "/" + name + ".html";
        $("#qunit-fixture").load(url, function() {
          equal($(id).length, 1, "fixture element with id '" + name +
                                 "' should exist");
          start();
        });
        stop();
      },
      teardown: function() {
        $(id).remove();
      }
    };
  };

  function makeTestModuleForLog(name, log) {
    module("load " + name);
    
    test("load scripts", function() {
      log.forEach(function(item) {
        ok(item.success, item.msg + " " + item.src);
      });
    });    
  }

  $(window).ready(function() {
    $.getJSON("../config.json", function(obj) {
      var scripts = obj.compiledFileParts;

      scripts = scripts.slice(scripts.indexOf('src/intro.js') + 1,
                              scripts.indexOf('src/main.js'));

      $.loadScripts(scripts, "../", function(log) {
        makeTestModuleForLog("bookmarklet scripts", log);
        window.jQuery.noConflict();
        $.loadScripts(unitTests, "unit/", function(log) {
          makeTestModuleForLog("unit tests", log);
          QUnit.start();
        });
      });
    });
  });
})();
