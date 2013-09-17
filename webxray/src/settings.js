(function(jQuery) {
  "use strict";

  function makeAbsoluteURL(baseURI, url) {
    if (url.match(/^https?:/))
      return url;
    return baseURI + url;
  }

  jQuery.webxraySettings = {
    extend: jQuery.extend,
    url: function(name) {
      if (jQuery.isArray(this[name])) {
        var self = this;
        return jQuery.map(this[name], function(url) {
          return makeAbsoluteURL(self.baseURI, url);
        });
      }
      return makeAbsoluteURL(this.baseURI, this[name]);
    },
    language: navigator.language || navigator.userLanguage,
    baseURI: "",
    cssURL: "webxray.css",
    preferencesURL: "preferences.html",
    easyRemixDialogURL: "easy-remix-dialog/index.html",
    uprootDialogURL: "uproot-dialog.html",
    hackpubURL: "http://hackpub.hackasaurus.org/",
    hackpubInjectionURL: "published-hack/injector.js",
    pluginURLs: []
  };
})(jQuery);
