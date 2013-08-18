(function(jQuery) {
  "use strict";

  var $ = jQuery;

  function addHelpButton(hud, input) {
    var help = $('<div class="webxray-base webxray-help">?</div>');
    help.click(input.showKeyboardHelp);    
    $(hud.overlayContainer).append(help);
  }

  // If the user has made changes to the page, we don't want them
  // to be able to navigate away from it without facing a modal
  // dialog.
  function ModalUnloadBlocker(commandManager) {
    function beforeUnload(event) {
      if (commandManager.canUndo()) {
        event.preventDefault();
        return Localized.get("unload-blocked");
      }
    }

    window.addEventListener("beforeunload", beforeUnload, true);

    return {
      unload: function() {
        window.removeEventListener("beforeunload", beforeUnload, true);
      }
    };
  }
  
  jQuery.extend({
    xRayUI: function xRayUI(options) {
      var isUnloaded = false;
      var hud = jQuery.hudOverlay();
      var focused = jQuery.focusedOverlay({
        useAnimation: true
      });
      var commandManager = jQuery.commandManager();
      var mixMaster = jQuery.mixMaster({
        hud: hud,
        focusedOverlay: focused,
        commandManager: commandManager
      });
      var persistence = jQuery.commandManagerPersistence(commandManager);
      var mouseMonitor = jQuery.mouseMonitor();
      var styleInfo = jQuery.styleInfoOverlay({
        focused: focused,
        commandManager: commandManager,
        mouseMonitor: mouseMonitor,
        hud: hud
      });
      var input = jQuery.xRayInput({
        focusedOverlay: focused,
        styleInfoOverlay: styleInfo,
        mixMaster: mixMaster,
        commandManager: commandManager,
        persistence: persistence,
        eventSource: options.eventSource,
        onQuit: function() {
          self.emit('quit');
        }
      });
      var touchToolbar = jQuery.touchToolbar(input);
      var indicator = jQuery.blurIndicator(input, window);
      var modalUnloadBlocker = ModalUnloadBlocker(commandManager);
      
      var self = jQuery.eventEmitter({
        persistence: persistence,
        start: function() {
          persistence.loadHistoryFromDOM();
          addHelpButton(hud, input);
          $(document.body).append(hud.overlayContainer);
          focused.on('change', hud.onFocusChange);
          input.activate();
          $(window).focus();
        },
        unload: function() {
          if (!isUnloaded) {
            isUnloaded = true;
            focused.destroy();
            focused = null;
            input.deactivate();
            input = null;
            touchToolbar.unload();
            touchToolbar = null;
            hud.destroy();
            hud = null;
            styleInfo.destroy();
            styleInfo = null;
            indicator = null;
            mouseMonitor.unload();
            mouseMonitor = null;
            modalUnloadBlocker.unload();
            modalUnloadBlocker = null;
          }
        },

        // These exports are primarily for use by third-party code.
        jQuery: jQuery,
        focusedOverlay: focused,
        hudOverlay: hud,
        mixMaster: mixMaster,
        styleInfoOverlay: styleInfo,
        commandManager: commandManager,
        input: input,
        modalUnloadBlocker: modalUnloadBlocker
      });

      return self;
    }
  });
})(jQuery);