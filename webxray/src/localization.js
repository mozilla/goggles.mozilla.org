(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  function parseLanguage(language) {
    var match = language.match(/([a-z]+)-([A-Z]+)/);
    if (match)
      return { language: match[1], region: match[2] }
    else
      return { language: language, region: null }
  }
  
  function normalizeLanguage(language) {
    var match = language.match(/([A-Za-z]+)-([A-Za-z]+)/);
    if (match)
      return match[1].toLowerCase() + "-" + match[2].toUpperCase();
    return language.toLowerCase();
  }
  
  jQuery.fn.extend({
    localize: function localize(locale, defaultScope) {
      locale = locale || jQuery.locale;

      this.find("[data-l10n]").each(function() {
        var scopedName = $(this).attr("data-l10n");
        if (scopedName.indexOf(':') == -1)
          scopedName = defaultScope + ':' + scopedName;
        $(this).text(locale.get(scopedName));
      });
    }
  });
  
  jQuery.localization = {
    extend: function extend(language, scope, obj) {
      language = normalizeLanguage(language);
      if (!(language in this))
        this[language] = {};
      for (var name in obj)
        this[language][scope + ":" + name] = obj[name];
    },
    createLocale: function createLocale(languages) {
      // We especially want to do this in the case where the client
      // is just passing in navigator.language, which is all lowercase
      // in Safari.
      languages = languages.map(normalizeLanguage);

      var locale = {
        languages: languages,
        has: function has(scopedName) {
          return (scopedName in locale);
        },
        get: function get(scopedName) {
          return locale[scopedName] || "unable to find locale string " + 
                 scopedName;
        },
        scope: function scopeLocale(scope) {
          return function(name) {
            return locale.get(scope + ":" + name);
          }
        }
      };
      
      languages.forEach(function(language) {
        var parsed = parseLanguage(language);
        if (parsed.language != language &&
            parsed.language in jQuery.localization)
          jQuery.extend.call(locale, jQuery.localization[parsed.language]);
        if (language in jQuery.localization)
          jQuery.extend.call(locale, jQuery.localization[language]);
      });
      
      return locale;
    },
    loadLocale: function(options) {
      var deferreds = [];
      var languages = options.languages.map(normalizeLanguage);

      languages.forEach(function(language) {
        var deferred = jQuery.Deferred();
        jQuery.ajax({
          url: options.path + language + ".js",
          dataType: "script",
          complete: function(jqXHR, textStatus) {
            deferred.resolve(language, textStatus);
          }
        });
        deferreds.push(deferred);
      });
      jQuery.when.apply(jQuery, deferreds).done(function() {
        var locale = jQuery.localization.createLocale(languages);
        options.complete(locale, arguments);
      });
    },
    init: function init(languages) {
      jQuery.locale = this.createLocale(languages);
    }
  };
  
  jQuery.localization.init([]);
})(jQuery);
