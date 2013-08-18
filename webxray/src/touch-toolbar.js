(function(jQuery) {
  "use strict";
  
  var $ = jQuery;
  
  function canBeTouched() {
    return ('ontouchstart' in window);
  }

  function makeButton(glyph, text, cb) {
    var button = $(
      '<div class="webxray-toolbar-button">' +
      '<div class="webxray-toolbar-button-glyph"></div>' +
      '<div class="webxray-toolbar-button-text"></div>' +
      '</div>'
      );
    var glyphDiv = $('.webxray-toolbar-button-glyph', button);
    glyphDiv.text(glyph);
    if (glyph.length != 1)
      glyphDiv.addClass('webxray-toolbar-button-glyph-tiny');
    $('.webxray-toolbar-button-text', button).text(text);
    button.find('*').andSelf().addClass('webxray-base');
    button.bind('touchstart touchmove click', function(event) {
      event.preventDefault();
      cb.call(this);
    });
    return button;
  }
    
  jQuery.extend({
    touchToolbar: function(input, locale, platform) {
      locale = locale || jQuery.locale;
      platform = platform || navigator.platform;

      var toolbar = $('<div class="webxray-base webxray-toolbar"></div>');

      input.keyboardHelp.forEach(function(binding) {
        if (binding.execute && (canBeTouched() || binding.alwaysInToolbar))
          makeButton(jQuery.nameForKey(binding.key, locale, platform),
                     Localized.get("short-command-descriptions:" + binding.cmd), function() {
                       binding.execute();
                     }).appendTo(toolbar);
      });
      
      toolbar.appendTo(document.body);
      input.on('activate', function() { toolbar.fadeIn(); });
      input.on('deactivate', function() { toolbar.fadeOut(); });
      
      return {
        unload: function() {
          toolbar.remove();
          toolbar = null;
        }
      };
    }
  });
})(jQuery);
