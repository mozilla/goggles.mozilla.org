(function(jQuery) {
  "use strict";

  var $ = jQuery;

  jQuery.fn.extend({
    postMessage: function(message, targetOrigin) {
      if ((jQuery.browser.mozilla && typeof(self) == "object" &&
           self.port && self.port.emit) ||
          (typeof(chrome) == "object" && chrome.extension)) {
        // We're most likely in a Jetpack, and need to work around
        // bug 666547. Or, we're in a Chrome extension and are
        // stymied by http://stackoverflow.com/q/4062879.

        if (!this.attr("id"))
          // Likelyhood of a naming collision here is very low,
          // and it's only a temporary workaround anyways.
          this.attr("id", "webxray-iframe-" + Math.random());

        var script = document.createElement("script");

        script.text = "(" + (function(id, message) {
          var iframe = document.getElementById(id);
          iframe.contentWindow.postMessage(message, "*");
        }).toString() + ")(" + JSON.stringify(this.attr("id")) + ", " +
        JSON.stringify(message) + ");";

        document.body.appendChild(script);
        document.body.removeChild(script);
      } else
        this[0].contentWindow.postMessage(message, targetOrigin);
    }
  });

  jQuery.extend({
    getModalDialogDimensions: function() {
      var div = $('<div class="webxray-base webxray-dialog-overlay">' +
                  '<div class="webxray-base webxray-dialog-outer">' +
                  '<div class="webxray-base webxray-dialog-middle">' +
                  '<div class="webxray-base webxray-dialog-inner">' +
                  '<div class="webxray-base webxray-dialog-content">' +
                  '</div></div></div></div></div>');
      $(document.body).append(div);

      var content = div.find('.webxray-dialog-content');
      var pos = content.offset();
      var dimensions = {
        top: pos.top,
        left: pos.left,
        width: content.outerWidth(),
        height: content.outerHeight()
      };
      
      div.remove();
      return dimensions;
    },
    simpleModalDialog: function(options) {
      var dialog = jQuery.modalDialog({
        input: options.input,
        url: options.url
      });
      dialog.iframe.one("load", function() {
        $(this).postMessage(options.payload, "*");
        $(this).show().bind("message", function(event, data) {
          if (data == "close")
            dialog.close();
        });
      });
      return dialog;
    },
    modalDialog: function(options) {
      var input = options.input;
      var body = options.body || document.body;
      var url = options.url;
      var div = $('<div class="webxray-base webxray-dialog-overlay">' +
                  '<div class="webxray-base webxray-dialog-outer">' +
                  '<div class="webxray-base webxray-dialog-middle">' +
                  '<div class="webxray-base webxray-dialog-inner">' +
                  '<iframe class="webxray-base" src="' + url + '"></iframe>' +
                  '</div></div></div></div>');
      var iframe = div.find("iframe");
      
      function onMessage(event) {
        if (event.source == self.iframe.get(0).contentWindow) {
          iframe.trigger("message", [event.data]);
        }
      }

      window.addEventListener("message", onMessage, false);
      iframe.hide();

      var self = {
        iframe: iframe,
        close: function close(cb) {
          div.fadeOut(function() {
            window.removeEventListener("message", onMessage, false);
            div.remove();
            div = null;
            
            // Firefox seems to trigger a mouseout/mouseover event
            // when we remove the dialog div, so we'll wait a moment
            // before re-activating input so that we don't distract
            // the user by focusing on whatever their mouse happens
            // to be over when the dialog closes.
            setTimeout(function() {
              input.activate();
              input = null;
              window.focus();
              if (cb)
                cb();
            }, 50);
          });
        }
      };

      input.deactivate();
      $(body).append(div);

      return self;
    },
    morphElementIntoDialog: function(options) {
      var input = options.input;
      var element = options.element;
      var body = options.body || document.body;
      var url = options.url;
      var overlay = $(element).overlayWithTagColor(1.0);
      var backdrop = $('<div class="webxray-base webxray-dialog-overlay">' +
                       '</div>');

      // Closing the dialog we make later will re-activate this for us.
      input.deactivate();

      $(body).append(backdrop);
      overlay.addClass('webxray-topmost');
      overlay.animate(jQuery.getModalDialogDimensions(), function() {
        var dialog = jQuery.modalDialog({
          input: input,
          body: body,
          url: url
        });
        
        backdrop.remove();

        dialog.iframe.one("load", function onLoad() {
          overlay.fadeOut(function() {
            overlay.remove();
            options.onLoad(dialog);
          });
        });        
      });
    },
    morphDialogIntoElement: function(options) {
      var element = options.element;
      var dialog = options.dialog;
      var input = options.input;
      var overlay = dialog.iframe.overlay();
      
      overlay.applyTagColor(element, 1.0);
      overlay.hide();
      overlay.fadeIn(function() {
        dialog.close(function() {
          // input was just re-activated when the dialog closed, but
          // we want to deactivate it again because we're not actually
          // done with our transition.
          input.deactivate();
          overlay.resizeTo(element, function() {
            $(this).fadeOut(function() {
              $(this).remove();
              input.activate();
            });
            options.onDone();
          });
        });
      });
    }
  });
})(jQuery);
