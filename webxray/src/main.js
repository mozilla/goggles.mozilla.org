(function(jQuery) {
  "use strict";

  var $ = jQuery;
  var removeOnUnload = $();
  
  function getMyScript() {
    return $('script.webxray, script[src$="webxray.js"]');
  }

  // If the goggles are already active on this page, just exit.
  if ($("#webxray-is-active").length) {
    getMyScript().remove();
    return;
  }

  function waitForCSSToLoad() {
    // Sadly, link elements don't fire load events on most/all browsers,
    // so we'll define a special style in our stylesheet and keep
    // polling an element with that style until it has what we've
    // defined in the stylesheet.
    var div = $('<div id="webxray-wait-for-css-to-load"></div>');
    var deferred = jQuery.Deferred();
    
    div.hide();
    $(document.body).append(div);

    function checkIfLoaded() {
      // This works on most browsers.
      var content = div.css('content');

      // This works on Safari.
      var bgColor = div.css('background-color');

      if ((content && content.match(/CSS\ is\ loaded/)) ||
          (bgColor && bgColor.match(/rgb\(0,\s*1,\s*2\)/))) {
        div.remove();
        clearInterval(intervalID);
        deferred.resolve();
      }
    }

    var intervalID = setInterval(checkIfLoaded, 10);
    checkIfLoaded();
    return deferred;
  }

  function waitForPreferencesToLoad() {
    var deferred = jQuery.Deferred();
    
    var iframe = document.createElement('iframe');
    iframe.src = jQuery.webxraySettings.url('preferencesURL');
    $(document.body).append(iframe);
    $(iframe).hide();
    window.addEventListener('message', function onMessage(event) {
      if (event.source == iframe.contentWindow) {
        window.removeEventListener('message', onMessage, false);
        $(iframe).remove();
        try {
          var prefs = JSON.parse(event.data);
          jQuery.webxraySettings.extend(prefs);
        } catch (e) {
          jQuery.warn("loading preferences failed");
          jQuery.warn("preference data is", event.data);
          jQuery.warn("exception thrown is", e);
        }
        deferred.resolve();
      }
    }, false);
    return deferred;
  }
  
  function loadPrerequisites(cb) {
    var script = getMyScript();
    
    if (jQuery.webxraySettings.baseURI.length == 0) {
      var baseURI = script.attr("src").match(/(.*)webxray\.js$/)[1];
      jQuery.webxraySettings.baseURI = baseURI;
    }
    
    var cssURL = jQuery.webxraySettings.url("cssURL");
    var cssLink = $('link[href="' + cssURL + '"]');
    var active = $('<div id="webxray-is-active"></div>');

    script.remove();
    active.hide();
    $(document.body).append(active);

    // This is a test to see if we're using legacy bookmarklet code,
    // which inserts the link tag itself.
    if (cssLink.length == 0) {
      cssLink = $('<link rel="stylesheet" class="webxray"></link>');
      $(document.head).append(cssLink.attr("href", cssURL));
    }

    removeOnUnload = removeOnUnload.add([cssLink.get(0), active.get(0)]);

    var cssLoaded = waitForCSSToLoad();
    var prefsLoaded = waitForPreferencesToLoad();
    
    jQuery.when(prefsLoaded, cssLoaded).done(cb);
  }

  function loadPlugins(cb) {
    var pluginsToLoad = [];

    jQuery.webxraySettings.url("pluginURLs").forEach(function(plugin) {
      pluginsToLoad.push(jQuery.loadScript(plugin));
    });
    jQuery.when.apply(jQuery.when, pluginsToLoad).done(cb);
  }
  
  jQuery.extend({webxrayBuildMetadata: buildMetadata});

  Localized.ready({url: xray.url}, function() {
    if (window.console && console.log) {
      console.log("Initializing Web X-Ray Goggles built on " +
                  buildMetadata.date + " (commit " +
                  buildMetadata.commit + ").");
    }
    
    loadPrerequisites(function() {
      var ui = jQuery.xRayUI({eventSource: document});
      window.webxrayUI = ui;
      loadPlugins(function() {
        var welcomeMsg = $("<div></div>");
        welcomeMsg.html(Localized.get("default-html"));
        jQuery.transparentMessage(welcomeMsg);

        ui.start();
        Webxray.triggerWhenLoaded(ui);
        ui.on('quit', function() {
          ui.persistence.saveHistoryToDOM();
          $(document).trigger('unload');
          delete window.webxrayUI;
        });
        $(document).unload(function() {
          ui.unload();
          removeOnUnload.remove();
        });
      });
    });
  });
})(jQuery);
