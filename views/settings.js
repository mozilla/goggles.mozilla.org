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
    baseURI: "",
    cssURL: "webxray.css",
    preferencesURL: "preferences.html",
    easyRemixDialogURL: "{{hostname}}/" + xray.lang + "/easy-remix-dialog/index.html",
    uprootDialogURL: "{{hostname}}/" + xray.lang + "/uproot-dialog.html",
    hackpubInjectionURL: "published-hack/injector.js",
    pluginURLs: [],
    hackpubURL: "{{hackpubURL}}",
    idwmoURL: "{{idwmoURL}}",
    publishwmoURL: "{{publishwmoURL}}"
  };
})(jQuery);
