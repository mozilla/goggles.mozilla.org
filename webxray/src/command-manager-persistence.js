(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  jQuery.extend({
    commandManagerPersistence: function CMPersistence(commandManager) {
      return {
        saveHistoryToDOM: function saveHistoryToDOM() {
          $('#webxray-serialized-history-v1').remove();
          var serializedHistory = $('<div></div>');
          serializedHistory.attr('id', 'webxray-serialized-history-v1')
                           .text(commandManager.serializeUndoStack()).hide();
          $(document.body).append(serializedHistory);
        },
        loadHistoryFromDOM: function loadHistoryFromDOM() {
          var serializedHistory = $('#webxray-serialized-history-v1');
          if (serializedHistory.length)
            try {
              commandManager.deserializeUndoStack(serializedHistory.text());
            } catch (e) {
              jQuery.warn("deserialization of history in DOM failed", e);
            }
        }
      };
    }
  });
})(jQuery);
