(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  function getContentSize(content) {
    var staged = $('<div class="webxray-base"></div>');
    staged.append(content.clone());
    staged.css({float: 'left'});
    $(document.body).append(staged);
    var width = staged.width();
    staged.remove();
    return width;
  }

  function onUserActivity(cb, bindTarget) {
    setTimeout(function() {
      var events = ['keydown', 'mousemove', 'touchstart'];
      function onEvent() {
        events.forEach(function(e) { $(bindTarget).unbind(e, onEvent); });
        cb();
      }
      events.forEach(function(e) { $(bindTarget).bind(e, onEvent); });
    }, jQuery.USER_ACTIVITY_DELAY);
  }
  
  jQuery.extend({
    USER_ACTIVITY_DELAY: 100,
    transparentMessage: function(content, duration, cb, parent, bindTarget) {
      var div = $('<div class="webxray-base webxray-tmsg-overlay">' +
                  '<div class="webxray-base webxray-tmsg-outer">' +
                  '<div class="webxray-base webxray-tmsg-middle">' +
                  '<div class="webxray-base webxray-tmsg-inner">' +
                  '</div></div></div></div>');

      var inner = div.find('.webxray-tmsg-inner');
      inner.append(content);
      inner.width(getContentSize(content));
      parent = parent || document.body;
      $(parent).append(div);

      function remove() {
        div.fadeOut(function() {
          div.remove();
          if (cb)
            cb();
        });
      }

      if (duration)
        setTimeout(remove, duration);
      else
        onUserActivity(remove, bindTarget || window);

      return div;
    }
  });
})(jQuery);
