(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  jQuery.extend({
    openBugReportDialog: function(input) {
      jQuery.simpleModalDialog({
        input: input,
        url: jQuery.webxraySettings.url("bugReportDialogURL"),
        payload: JSON.stringify({
          buildMetadata: buildMetadata,
          hackpubURL: jQuery.webxraySettings.url("bugReportHackpubURL"),
          originalURL: window.location.href
        })
      });
    }
  });
})(jQuery);
