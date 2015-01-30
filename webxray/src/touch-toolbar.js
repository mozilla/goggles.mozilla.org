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
    button.addClass("glyph-"+glyph);
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

  function makeTip(button, text) {
    var top = parseInt(button.position().top,10);
    var height = parseInt(button.height(),10);
    if(window.__seenGogglesHint) {
      return;
    }
    var hint = $(
      '<div class="webxray-toolbar-hint">' +
      '<div class="webxray-toolbar-hint-text"></div>' +
      '<button class="webxray-toolbar-hint-dismiss webxray-toolbar-button">'+
      Localized.get("OK") +
      '</button>'+
      '<div class="webxray-toolbar-hint-ra"></div>' +
      '</div>'
    );

    //hint.find('*').andSelf().addClass('webxray-base');

    $('.webxray-toolbar-hint-text', hint).html(text);

    var button = hint.find(".webxray-toolbar-hint-dismiss");
    button.bind('touchstart touchmove click', function(event) {
      event.preventDefault();
      hint.remove();
    });

    hint.find('*').andSelf().addClass('webxray-base');

    hint.css({top: (top-height/2)+"px"});

    return hint;
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

      var showFirstHint = "webxray-show-first-use-hint";
      var showPublishtHint = "webxray-show-publish-hint";
      var hints = {};
      var activeHint = false;

      var disableHints = function() {
        if(activeHint) {
          window[activeHint] = true;
          hints[activeHint].remove();
        }
      };

      var showHint = function(type) {
        activeHint = type;
        hints[activeHint].appendTo(toolbar);
      }

      toolbar.appendTo(document.body).ready(function() {

        hints[showFirstHint] = makeTip(
          $(".glyph-esc", toolbar),
          Localized.get("first use hint")
        );

        hints[showPublishtHint] = makeTip(
          $(".glyph-P", toolbar),
          Localized.get("first publish hint")
        );

        document.addEventListener("webxray-element-modified", function(evt) {
          if(window[showPublishtHint]) return;
          disableHints();
          showHint(showPublishtHint)
        });

        if(window[showFirstHint]) return;
        disableHints();
        showHint(showFirstHint)
      });


      var showFirstPublishEvent = "webxray-show-publish-hint";
      window.addEventListener(showFirstPublishEvent, function(evt) {
        if(window[showFirstPublishEvent]) return;
        window[showFirstPublishEvent] = true;
        toolbar.showPublishHint();
      });

      input.on('activate', function() { toolbar.fadeIn(); });
      input.on('deactivate', function() { disableHints(); toolbar.fadeOut(); });

      return {
        unload: function() {
          toolbar.remove();
          toolbar = null;
        }
      };
    }
  });
})(jQuery);
