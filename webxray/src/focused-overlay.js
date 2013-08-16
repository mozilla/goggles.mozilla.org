(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  jQuery.focusedOverlay = function focusedOverlay(options) {
    if (!options)
      options = {};
    
    var useAnimation = options.useAnimation;
    var ancestorIndex = 0;
    var ancestorOverlay = null;
    var overlay = null;
    var element = null;

    function labelOverlay(overlay, target, finalSize) {
      var parts = ["top", "bottom"];
      
      if ($(target).isVoidElement())
        parts = ["top"];
      
      finalSize = finalSize || overlay;
      parts.forEach(function(className) {
        var part = $('<div class="webxray-base webxray-overlay-label">' +
                     '</div>');
        var tag = target.nodeName.toLowerCase();
        part.addClass("webxray-overlay-label-" + className);
        part.text("<" + (className == "bottom" ? "/" : "") +
                  tag + ">");
        overlay.append(part);
        if (part.width() > $(finalSize).width() ||
            part.height() > $(finalSize).height())
          part.hide();
      });
    }

    function setAncestorOverlay(ancestor, useAnimation) {
      if (ancestorOverlay) {
        ancestorOverlay.remove();
        ancestorOverlay = null;
      }
      if (ancestor) {
        if (useAnimation) {
          var fromElement = instance.getPrimaryElement();
          ancestorOverlay = $(fromElement).overlay();
          ancestorOverlay.resizeTo(ancestor);
        } else
          ancestorOverlay = ancestor.overlay();
        ancestorOverlay.addClass("webxray-ancestor");
        labelOverlay(ancestorOverlay, ancestor[0], ancestor[0]);        
        instance.ancestor = ancestor[0];
      } else {
        if (useAnimation && instance.ancestor) {
          ancestorOverlay = $(instance.ancestor).overlay();
          ancestorOverlay.addClass("webxray-ancestor");
          labelOverlay(ancestorOverlay, instance.element, instance.element);
          ancestorOverlay.resizeToAndFadeOut(instance.element);
        }
        instance.ancestor = null;
      }
    }

    var instance = jQuery.eventEmitter({
      element: null,
      ancestor: null,
      getPrimaryElement: function getPrimaryElement() {
        return this.ancestor || this.element;
      },
      upfocus: function upfocus() {
        if (!element)
          return;
        var ancestor = $(element).ancestor(ancestorIndex + 1);

        if (ancestor.length && ancestor[0] != document) {
          ancestorIndex++;
          setAncestorOverlay(ancestor, useAnimation);
        }
        this.emit('change', this);
      },
      downfocus: function downfocus() {
        if (!element)
          return;
        if (ancestorOverlay) {
          ancestorOverlay.remove();
          ancestorOverlay = null;
        }
        if (ancestorIndex > 0 && --ancestorIndex > 0) {
          var ancestor = $(element).ancestor(ancestorIndex);
          setAncestorOverlay(ancestor, useAnimation);
        } else
          setAncestorOverlay(null, useAnimation);
        this.emit('change', this);
      },
      unfocus: function unfocus() {
        if (!element)
          return;
        overlay.remove();
        overlay = null;
        element = this.element = null;
        setAncestorOverlay(null);
        ancestorIndex = 0;
        this.emit('change', this);
      },
      set: function set(newElement) {
        this.unfocus();
        element = this.element = newElement;
        overlay = $(element).overlayWithTagColor();
        labelOverlay(overlay, element);
        this.emit('change', this);
      },
      destroy: function destroy() {
        this.unfocus();
        this.removeAllListeners('change');
      }
    });
    
    return instance;
  }
})(jQuery);
