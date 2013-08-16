(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  jQuery.extend({
    blurIndicator: function(input, focusable, body) {
      body = body || document.body;
      
      function showBlurIndicator() {
        var blurIndicator = $('<div class="webxray-base ' +
                              'webxray-dialog-overlay"></div>');
        $(body).append(blurIndicator);
        $(focusable).one('focus', function() {
          // If we wait a moment before removing the indicator, it'll receive
          // any click events instead of elements underneath it. We can
          // safely assume that any click events made immediately after
          // focus are really just intended to focus the page rather
          // than click on a specific element, so we want to swallow
          // such events rather than e.g. take the user to a new page.
          setTimeout(function() {
            blurIndicator.remove();
            blurIndicator = null;
          }, 10);
          input.activate();
        });
        input.deactivate();
      }

      input.on('activate', function() {
        $(focusable).bind('blur', showBlurIndicator);
      });
      input.on('deactivate', function() {
        $(focusable).unbind('blur', showBlurIndicator);
      });
    }
  });
})(jQuery);
