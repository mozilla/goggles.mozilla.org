(function(jQuery) {
  "use strict";
  
  var $ = jQuery;
  
  jQuery.extend({
    loadScripts: function loadScripts(scripts, prefix, cb) {
      scripts = scripts.slice();
      scripts.reverse();

      var log = [];

      function loadNextScript() {
        var errorThrown = false;

        function onWindowError(event) {
          if (event.target == window)
            errorThrown = true;
        }

        function cleanupAndLoadNext() {
          window.removeEventListener("error", onWindowError, false);
          loadNextScript();
        }

        if (scripts.length) {
          var src = scripts.pop();

          if (src == "src/locale/*.js")
            src = "src/locale/en.js";
          
          src = prefix + src;
          if (src.match(/\.local\./)) {
            // TODO: Do an XHR to see if the file exists and
            // load it if so, instead of skipping it entirely.
            // We're skipping it for now b/c opera doesn't
            // seem to fire error events when scripts aren't
            // found, so it just hangs if we don't do this.
            log.push({
              success: true,
              msg: "skipping optional script",
              src: src
            });
            loadNextScript();
            return;
          }

          if (!window.addEventListener) {
            jQuery.getScript(src, function() {
              log.push({
                success: true,
                msg: "loaded",
                src: src
              });
              loadNextScript();
            });
            return;
          }
          
          var script = document.createElement('script');
          script.setAttribute('src', src);
          script.addEventListener("load", function () {
            if (errorThrown) {
              log.push({
                success: false,
                msg: "error thrown while loading",
                src: src
              });
            } else
              log.push({
                success: true,
                msg: "loaded",
                src: src
              });
            cleanupAndLoadNext();
          }, false);
          script.addEventListener("error", function() {
            log.push({
              success: false,
              msg: "could not find",
              src: src
            });
            cleanupAndLoadNext();
          }, false);
          window.addEventListener("error", onWindowError, false);
          document.head.appendChild(script);
        } else {
          cb(log);
        }
      }

      loadNextScript();
    }
  });
})(jQuery);
