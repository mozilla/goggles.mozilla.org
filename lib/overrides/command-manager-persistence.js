(function(jQuery) {
  "use strict";

  var $ = jQuery;

  jQuery.extend({
    commandManagerPersistence: function CMPersistence(commandManager) {
      return {
        saveHistoryToDOM: function saveHistoryToDOM() {
          // this history isn't used by our interface, as we do cannot
          // "load" goggles publications after the fact
        },
        loadHistoryFromDOM: function loadHistoryFromDOM() {
          // see above
        }
      };
    }
  });
})(jQuery);
