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

  // Because we bleach scripts, we can't rely on the nice X-ray goggle fade-in notice.
  // instead we use an element with inline styling to show the notice instead.
  var astyle = 'style="color:white!important;text-decoration:underline!important;"',
      toptext = 'This page was made with the <a '+astyle+' href="https://goggles.webmaker.org" class="goggles">Web X-Ray Goggles</a>,' +
                ' part of the <a '+astyle+' href="https://webmaker.org">Mozilla Webmaker</a> toolkit.</span>',
      topstyle = 'position:absolute;top:0;left:0;right:0;height:1.4em;background:black;z-index:999999;' +
                 'text-align:center;color:white;opacity:0.6;',
      topnotice = '<div style="' + topstyle + '">' + toptext + '</div>';

  jQuery.extend({
    openUprootDialog: function(input) {
      $(document).uprootIgnoringWebxray(function(html) {
        var injectURL = jQuery.webxraySettings.url("hackpubInjectionURL");
        var hackpubInfo = {
          injectURL: injectURL,
          originalURL: window.location.href,
          submissionDate: (new Date()).toString()
        };

        // Rewrite the title to "...'s remix of ...", instead of injecting
        // the hackpub information, like vanilla webxray would do.
        html = html.replace(/<title([^>]*)>/, "<title$1>{{username}}'s' remix of ");

        // thanks to different browsers reserialising HTML differently, we
        // can't do an if((html.indexOf(topnotice)===-1) { add } here. However,
        // adding another one will put it in exactly the same spot, and just make
        // it look darker. We can solve this problem separately.
        html = html.replace("</body", topnotice + "</body");

        jQuery.simpleModalDialog({
          input: input,
          url: jQuery.webxraySettings.url("uprootDialogURL"),
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
          var html = doctype + '\n<html>' +
                     document.documentElement.innerHTML + '</html>';
          removal.undo();
          $(base).remove();
          cb.call(elem, html);
        }, 0);
    }
  });
})(jQuery);
