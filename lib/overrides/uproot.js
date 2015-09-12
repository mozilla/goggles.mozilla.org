(function(jQuery) {
  "use strict";

  var $ = jQuery;

  function makeDoctypeTag(doctype) {
    if (!doctype)
      return '';
    var tag = '<!DOCTYPE ' + doctype.name;
    if (doctype.publicId && doctype.publicId.length)
      tag += ' PUBLIC "' + doctype.publicId + '"';
    if (doctype.systemId && doctype.systemId.length)
      tag += ' "' + doctype.systemId + '"';
    return tag += '>';
  }

  jQuery.extend({
    openUprootDialog: function(input) {
      $(document).uprootIgnoringWebxray(function(html) {
        var injectURL = jQuery.webxraySettings.url("hackpubInjectionURL");
        var hackpubInfo = {
          injectURL: injectURL,
          originalURL: window.location.href,
          submissionDate: (new Date()).toString()
        };

        jQuery.simpleModalDialog({
          input: input,
          url: jQuery.webxraySettings.url("uprootDialogURL"),
          classes: "webxray-publish-dialog",
          payload: JSON.stringify({
            html: html,
            hackpubURL: jQuery.webxraySettings.url("hackpubURL"),
            originalURL: hackpubInfo.originalURL
          })
        });
      });
    }
  });

  jQuery.fn.extend({
    uprootIgnoringWebxray: function(cb) {
      $(document).uproot({
        success: cb,
        ignore: $(".webxray-hud-box, .webxray-overlay, " +
                  ".webxray-dialog-overlay, link.webxray, " +
                  "#webxray-is-active, .webxray-toolbar, " +
                  ".webxray-style-info, .webxray-tmsg-overlay")
      });
    },
    uproot: function(cb) {
      var options = {
        ignore: $()
      };
      if (typeof(cb) == 'object') {
        options = cb;
        cb = options.success;
      }
      var elem = this[0];
      var document = elem.contentDocument || elem;
      if (document.nodeName != "#document")
        throw new Error("first item of query must be a document or iframe");
      var base = document.createElement('base');
      if ($('base', document).length === 0) {
        $(base).attr('href', document.location.href);
        $(document.head).prepend(base);
      }
      if (cb)
        setTimeout(function() {
          var ignore = options.ignore.add('script', document);
          var removal = ignore.temporarilyRemove();
          var doctype = makeDoctypeTag(document.doctype);
          var html = doctype + document.querySelector("html").outerHTML;
          removal.undo();
          $(base).remove();
          cb.call(elem, html);
        }, 0);
    }
  });
})(jQuery);
