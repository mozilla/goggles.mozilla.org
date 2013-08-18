(function(jQuery) {
  "use strict";

  var $ = jQuery;

  var DEFAULT_PROPERTIES = [
    "background-attachment",
    "background-clip",
    "background-color",
    "background-image",
    "background-origin",
    "background-position",
    "background-repeat",
    "background-size",
    "font-family",
    "font-size",
    "font-style",
    "font-variant",
    "font-weight",
    "height",
    "list-style-image",
    "list-style-position",
    "list-style-type",
    "min-height",
    "min-width",
    "text-align",
    "text-anchor",
    "text-decoration",
    "text-indent",
    "text-overflow",
    "text-rendering",
    "text-shadow",
    "text-transform",
    "top",
    "left",
    "bottom",
    "right",
    "color",
    "clear",
    "cursor",
    "direction",
    "display",
    "position",
    "float",
    "letter-spacing",
    "line-height",
    "opacity",
    "visibility",
    "white-space",
    "width",
    "vertical-align",
    "word-spacing",
    "word-wrap",
    "z-index"
  ].sort(),
  l10n = Localized.get;

  DEFAULT_PROPERTIES.forEach(function(name) {
    if (name.match(/image$/))
      jQuery.cssHooks[jQuery.camelCase(name)] = {
        set: function(elem, value) {
          if (value != "none" && !value.match(/^\s*url\(.*\)/))
            return "url(" + value + ")";
          return value;
        }
      };
  });

  function makeCssValueEditable(event) {
    var row = $(this);
    var widget = row.data("propertyWidget");

    if (event.shiftKey) {
      open('https://developer.mozilla.org/en/CSS/' + widget.name, 'info');
      return;
    }
    
    if (widget.isBeingEdited())
      return;

    var nameCell = $(this).find('.webxray-name');
    var valueCell = $(this).find('.webxray-value');
    var originalValue = valueCell.text();
    var form = $('<form><input type="text"></input></form>');
    var textField = form.find("input");

    valueCell.empty().append(form);
    textField.val(originalValue).select().focus();

    // The -1 is needed on Firefox, or else the whole field will
    // wrap to the next line.
    textField.width(row.width() - nameCell.outerWidth() - 1);

    function revertToOriginal() {
      form.remove();
      valueCell.text(originalValue);
      widget.clearPreview();
    }
    
    function confirmChange() {
      var newValue = textField.val();
      revertToOriginal();
      widget.changeValue(newValue);
    }
    
    textField.blur(confirmChange);
    textField.keydown(function(event) {
      if (event.keyCode == $.keys.ESC) {
        revertToOriginal();
        return false;
      }
    });
    textField.keyup(function(event) {
      widget.previewValue(textField.val());
    });

    form.submit(function() {
      confirmChange();
      return false;
    });
  }

  function buildPropertyWidget(element, row, style, parentStyle, name, hud) {
    var nameCell = $('<div class="webxray-name"></div>');
    var valueCell = $('<div class="webxray-value"></div>');

    // Replace hyphens with non-breaking ones to keep
    // the presentation looking nice.
    nameCell.text(name.replace(/-/g, '\u2011'));
    row.append(nameCell);
    row.append(valueCell);

    var lastPreviewValue = null;
    
    var self = {
      name: name,
      getValue: function() {
        return valueCell.text();
      },
      isBeingEdited: function() {
        return (row.find('form').length != 0);
      },
      refresh: function() {
        var value = $.normalizeStyleProperty(style, name);
        
        // TODO: It might be possible for us to return from this
        // function when in fact we need to change class information.
        // Need to think about this more.
        if (valueCell.text() == value)
          return;

        valueCell.text(value);
        valueCell.attr("class", "webxray-value");
        if (parentStyle &&
            $.normalizeStyleProperty(parentStyle, name) != value)
          valueCell.addClass("webxray-value-different-from-parent");
        if ($.normalizeStyleProperty(element.style, name) == value)
          valueCell.addClass("webxray-value-matches-inline-style");
        if (name.match(/color$/)) {
          var colorBlock = $('<div class="webxray-color-block"></div>');
          colorBlock.css('background-color', value);
          valueCell.append(colorBlock);
        }
      },
      clearPreview: function() {
        if (lastPreviewValue !== null) {
          jQuery.style(element, name, lastPreviewValue);
          lastPreviewValue = null;
        }
      },
      previewValue: function(newValue) {
        self.clearPreview();
        lastPreviewValue = jQuery.style(element, name);
        jQuery.style(element, name, newValue);
      },
      changeValue: function(newValue) {
        var originalValue = valueCell.text();
        if (newValue != originalValue) {
          $(element).css(name, newValue);
          self.refresh();
          row.trigger('css-property-change');
        }
      }
    };
    
    row.data("propertyWidget", self);
    row.mouseover(function() {
      var docKey = "css-property-docs:" + name;
      if (l10n(docKey)) {
        var moreInfo = $('<span class="webxray-more-info"></span>')
          .text(l10n("more-info"));
        $(hud.overlay).html(l10n(docKey))
          .append(moreInfo)
          .find("a").css({textDecoration: "none"});
      }
    });
    self.refresh();
  }

  function PrimaryTranslucentOverlay(overlay, primary) {
    var tOverlay = $(primary).overlayWithTagColor(0.2);

    function onCssPropertyChange() {
      tOverlay.show();
      tOverlay.resizeTo(primary, function() {
        tOverlay.fadeOut();
      });
    }

    overlay.bind('css-property-change', onCssPropertyChange);
    tOverlay.hide();

    return {
      destroy: function() {
        overlay.unbind('css-property-change', onCssPropertyChange);
        tOverlay.remove();
      }
    };
  }

  function ModalOverlay(overlay, primary, input) {
    var startStyle = $(primary).attr("style");
    var translucentOverlay = PrimaryTranslucentOverlay(overlay, primary);
    
    function handleKeyDown(event) {
      if (self.isBeingEdited())
        return;
      switch (event.keyCode) {
        case $.keys.ESC:
        event.preventDefault();
        event.stopPropagation();
        self.close();
        break;
        
        case $.keys.LEFT:
        case $.keys.RIGHT:
        input.handleEvent(event);
        if (primary.parentNode) {
          startStyle = $(primary).attr("style");
          overlay.show().find('.webxray-row').each(function() {
            $(this).data("propertyWidget").refresh();
          });
        } else {
          // Um, our target element is no longer attached to
          // the document. Just exit the style editing mode.

          // TODO: Is this the most humane behavior?
          self.close();
        }
        break;
      }
    }
    
    function recordChanges() {
      var endStyle = $(primary).attr("style");
      if (startStyle != endStyle) {
        if (typeof(startStyle) == 'undefined')
          $(primary).removeAttr("style")
        else
          $(primary).attr("style", startStyle);
        startStyle = endStyle;
        self.emit('change-style', endStyle);
      }
    }
    
    overlay.addClass("webxray-style-info-locked");
    overlay.bind('css-property-change', recordChanges);
    overlay.find('.webxray-row').bind('click', makeCssValueEditable);
    window.addEventListener("keydown", handleKeyDown, true);  

    var self = jQuery.eventEmitter({
      isBeingEdited: function() {
        return (overlay.find('form').length != 0);
      },
      close: function() {
        overlay.removeClass("webxray-style-info-locked");
        overlay.unbind('css-property-change', recordChanges);
        overlay.find('.webxray-row').unbind('click', makeCssValueEditable);
        overlay.find('.webxray-close-button').unbind('click', self.close);
        window.removeEventListener("keydown", handleKeyDown, true);
        translucentOverlay.destroy();
        self.emit('close');
      }
    });

    overlay.find('.webxray-close-button').bind('click', self.close);

    return self;
  }

  jQuery.extend({
    normalizeStyleProperty: function normalizeStyleProperty(style, name) {
      var value = style.getPropertyValue(name);

      if (name.match(/image$/) && value) {
        var urlMatch = value.match(/url\("?([^"]*)"?\)/);

        if (urlMatch)
          value = urlMatch[1];
      }
      return value;
    },
    styleInfoOverlay: function styleInfoOverlay(options) {
      var focused = options.focused;
      var commandManager = options.commandManager;
      var propertyNames = options.propertyNames;
      var mouseMonitor = options.mouseMonitor;
      var hud = options.hud;
      var body = options.body || document.body;
      var isVisible = false;
      var modalOverlay = null;
      
      var overlay = $('<div class="webxray-base webxray-style-info"></div>');
      $(body).append(overlay);
      overlay.hide();
      
      focused.on('change', refresh);
      
      function refresh() {
        if (!isVisible || modalOverlay)
          return;

        var primary = focused.getPrimaryElement();
        overlay.empty();
        
        if (primary) {
          var info = $(primary).getStyleInfo(propertyNames, hud);
          var instructions = $('<div class="webxray-instructions"></div>');
          var close = $('<div class="webxray-close-button"></div>');
          instructions.html(l10n("tap-space-html"));
          close.text(l10n("dialog-common:ok"));
          overlay.append(info).append(instructions).append(close);
          overlay.show();
        } else {
          overlay.hide();
        }
      }

      function isMouseInOverlay() {
        var mouse = mouseMonitor.lastPosition;
        var pos = overlay.offset();
        var width = overlay.width();
        var height = overlay.height();
        var xDiff = mouse.pageX - pos.left;
        var yDiff = mouse.pageY - pos.top;
        var isInOverlay = (xDiff > 0 && xDiff < width) &&
                          (yDiff > 0 && yDiff < height);

        return isInOverlay;
      }

      function maybeSwitchSides() {
        if (isMouseInOverlay())
          overlay.toggleClass('webxray-on-other-side');
        // The overlay switched sides; now see if we're in the
        // overlay on the other side.
        if (isMouseInOverlay())
          // We're on the overlay on the other side too, so we're
          // just going to annoy the user if we switch its side.
          // So, we'll restore the overlay to its original position.
          overlay.toggleClass('webxray-on-other-side');
      }
      
      var self = jQuery.eventEmitter({
        isVisible: function() {
          return isVisible;
        },
        isLocked: function() {
          return (modalOverlay !== null);
        },
        setPropertyNames: function(newPropertyNames) {
          propertyNames = newPropertyNames;
        },
        lock: function(input) {
          var primary = focused.getPrimaryElement();
          
          if (primary) {
            input.deactivate();
            mouseMonitor.removeListener('move', maybeSwitchSides);
            modalOverlay = ModalOverlay(overlay, primary, input);
            modalOverlay.on('change-style', function(style) {
              commandManager.run("ChangeAttributeCmd", {
                name: l10n("style-change"),
                attribute: "style",
                value: style,
                element: primary
              });
            });
            modalOverlay.on('close', function() {
              modalOverlay = null;
              self.hide();
              input.activate();
              self.emit('unlock');
            });
            focused.unfocus();
            self.emit('lock', {
              element: primary
            });
          }
        },
        show: function() {
          isVisible = true;
          overlay.show();
          refresh();
          mouseMonitor.on('move', maybeSwitchSides);
          maybeSwitchSides();
          self.emit('show');
        },
        hide: function() {
          mouseMonitor.removeListener('move', maybeSwitchSides);
          isVisible = false;
          overlay.hide();
          self.emit('hide');
        },
        destroy: function() {
          if (modalOverlay)
            modalOverlay.close();
          focused.removeListener('change', refresh);
          overlay.remove();
        }
      });

      return self;
    }
  });
  
  jQuery.fn.extend({
    getStyleInfo: function getStyleInfo(propertyNames, hud) {
      var names = propertyNames || DEFAULT_PROPERTIES;
      var element = this.get(0);
      var window = element.ownerDocument.defaultView;
      var style = window.getComputedStyle(element);
      var parentStyle = null;

      if (element.nodeName != "HTML")
        parentStyle = window.getComputedStyle(element.parentNode);

      var info = $('<div class="webxray-rows"></div>');
      var NUM_COLS = 1;

      for (var i = 0; i < names.length + (NUM_COLS-1); i += NUM_COLS) {
        var row = $('<div class="webxray-row"></div>');
        for (var j = 0; j < NUM_COLS; j++)
          buildPropertyWidget(element, row, style, parentStyle, names[i+j], hud);
        info.append(row);
      }

      return info;
    }
  });
})(jQuery);
