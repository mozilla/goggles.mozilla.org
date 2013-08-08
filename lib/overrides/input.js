(function(jQuery) {
  "use strict";

  var $ = jQuery;

  var keys = {
    DELETE: 8,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ESC: 27,
    SPACE: 32
  };

  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (var i = 0; i < alphabet.length; i++)
    keys[alphabet[i]] = alphabet.charCodeAt(i);

  function isValidFocusTarget(target) {
    return (!$(target).hasClass('webxray-base'));
  }

  // This function attempts to compensate for a browser's lack of support
  // for the 'pointer-events' CSS feature.
  var maybePassThroughEvent = (function() {
    function topmostNoPointerEvents(element) {
      var topmost = null;
      while (element &&
             getComputedStyle(element).pointerEvents == 'none') {
        topmost = element;
        element = element.parentNode;
      }
      return topmost;
    }
    
    // Annoying that we have to do browser detection here, but unfortunately
    // we can't simply test for support of the 'pointer-events' CSS feature,
    // as Opera and IE9 support it but only for SVG.
    if (jQuery.browser.opera || jQuery.browser.msie)
      return function(event) {
        if (topmostNoPointerEvents(event.relatedTarget))
          return null;

        var target = topmostNoPointerEvents(event.target);

        if (target) {
          $(target).hide();
          event = {
            target: document.elementFromPoint(event.clientX, event.clientY)
          };
          $(target).show();
        }
        return event;
      }
    else
      return function(event) { return event; };
  })();
  
  function styleOverlayInputHandlers(options) {
    var styleInfo = options.styleInfoOverlay;
    var quasimodeKeycode = keys[options.quasimodeKey];
    var lockForEditingKeycode = keys[options.lockForEditingKey];
    var isQuasimodeActive = false;

    return {
      keyup: function(event) {
        if (event.keyCode == quasimodeKeycode) {
          isQuasimodeActive = false;
          styleInfo.hide();
          return true;
        }
        return false;
      },
      keydown: function(event) {
        if (event.altKey || event.ctrlKey ||
            event.altGraphKey || event.metaKey) {
          return false;
        }
        
        switch (event.keyCode) {
          case lockForEditingKeycode:
          if (isQuasimodeActive) {
            isQuasimodeActive = false;
            styleInfo.lock(this);
          }
          return true;

          case quasimodeKeycode:
          if (!isQuasimodeActive) {
            isQuasimodeActive = true;
            styleInfo.show();
          }
          return true;
        }
        return false;
      }
    };
  }

  function touchInputHandlers(focused) {
    var lastTouch = null;
    
    function onTouchMove(event) {
      var touches = event.changedTouches;
      var touch = touches[0];
      var element = document.elementFromPoint(touch.clientX,
                                              touch.clientY);
      
      if (element == lastTouch)
        return false;
      lastTouch = element;

      if (!isValidFocusTarget(element))
        return false;
      
      if (isValidFocusTarget(element))
        focused.set(element);
    }
    
    return {
      touchstart: onTouchMove,
      touchmove: onTouchMove,
      touchend: function(event) {
        lastTouch = null;
      }
    };
  }
  
  jQuery.extend({
    keys: keys,
    mouseMonitor: function mouseMonitor() {
      function onMouseMove(event) {
        self.lastPosition.pageX = event.pageX;
        self.lastPosition.pageY = event.pageY;
        self.emit('move', self);
      }
      $(document).mousemove(onMouseMove);
      
      var self = jQuery.eventEmitter({
        lastPosition: {
          pageX: 0,
          pageY: 0
        },
        unload: function() {
          $(document).unbind('mousemove', onMouseMove);
          self.removeAllListeners();
        }
      });
      
      return self;
    },
    inputHandlerChain: function inputHandlerChain(eventTypes, eventSource) {
      var handlerChains = {};
      var listeners = {};
      
      function eventListener(event) {
        for (var i = 0; i < handlerChains[event.type].length; i++) {
          if (handlerChains[event.type][i].call(this, event)) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
        }
      }
      
      eventTypes.forEach(function(eventName) {
        handlerChains[eventName] = [];
        listeners[eventName] = eventListener;
      });

      var self = jQuery.inputManager(listeners, eventSource).extend({
        add: function(handlers) {
          for (var name in handlers)
            handlerChains[name].push(handlers[name]);
        }
      });
      
      return self;
    },
    inputManager: function inputManager(listeners, eventSource) {
      var isActive = false;

      var self = jQuery.eventEmitter({
        extend: jQuery.extend,
        handleEvent: function handleEvent(event) {
          if (event.type in listeners)
            listeners[event.type].call(self, event);
          else
            throw new Error("Unexpected event type: " + event.type);
        },
        activate: function() {
          // We're listening during the capture phase to intercept
          // any events at the earliest point before they're
          // handled by the page itself. Because JQuery's bind() doesn't
          // appear to allow for listening during the capture phase,
          // we're using document.addEventListener() directly.
          if (!isActive) {
            isActive = true;
            for (var name in listeners)
              eventSource.addEventListener(name, self.handleEvent, true);
            self.emit('activate');
          }
        },
        deactivate: function() {
          if (isActive) {
            isActive = false;
            for (var name in listeners)
              eventSource.removeEventListener(name, self.handleEvent, true);
            self.emit('deactivate');
          }
        }
      });
      
      return self;
    },
    simpleKeyBindings: function simpleKeyBindings() {
      var bindings = {};
      return {
        set: function(keycodes) {
          for (var keycode in keycodes) {
            if (!(keycode in keys))
              throw new Error('unknown key: ' + keycode);
            bindings[keys[keycode]] = keycodes[keycode];
          }
        },
        handlers: {
          keydown: function(event) {
            if (event.altKey || event.ctrlKey ||
                event.altGraphKey || event.metaKey)
              return false;

            if (typeof(bindings[event.keyCode]) == 'function') {
              bindings[event.keyCode].call(this, event);
              return true;
            }
            return false;
          }
        }
      };
    },
    xRayInput: function xRayInput(options) {
      var focused = options.focusedOverlay;
      var mixMaster = options.mixMaster;
      var commandManager = options.commandManager;
      var eventSource = options.eventSource;
      var onQuit = options.onQuit;
      var persistence = options.persistence;
      var styleInfo = options.styleInfoOverlay;
      var touchesReceived = false;
      var self = jQuery.inputHandlerChain([
        'keydown',
        'keyup',
        'click',
        'mouseout',
        'mouseover',
        'touchstart',
        'touchmove',
        'touchend'
      ], eventSource);
      
      self.add({
        click: function(event) {
          if (isValidFocusTarget(event.target)) {
            self.commandBindings['remix'].execute();
            return true;
          }
        },
        touchmove: function(event) {
          touchesReceived = true;
          return false;
        },
        mouseout: function(event) {
          if (touchesReceived)
            // We're likely on a tablet, so this is probably a simulated
            // mouse event that we want to ignore.
            return false;
          if ((event = maybePassThroughEvent(event)) == null)
            return false;
          
          if (isValidFocusTarget(event.target)) {
            focused.unfocus();
            return true;
          }
        },
        mouseover: function(event) {
          if (touchesReceived)
          // We're likely on a tablet, so this is probably a simulated
          // mouse event that we want to ignore.
            return false;
          if ((event = maybePassThroughEvent(event)) == null)
            return false;

          if (isValidFocusTarget(event.target)) {
            focused.set(event.target);
            return true;
          }
        }
      });

      self.extend({
        simpleKeyBindings: jQuery.simpleKeyBindings(),
        keyboardHelp: [],
        commandBindings: {},
        showKeyboardHelp: function() {
          var help = jQuery.createKeyboardHelpReference(self.keyboardHelp);
          jQuery.transparentMessage(help);
        },
        addSimpleKeyBindings: function(bindings) {
          bindings.forEach(function(binding) {
            if (binding.cmd) {
              self.keyboardHelp.push(binding);
              self.commandBindings[binding.cmd] = binding;
            }
            if (binding.execute) {
              var simpleBinding = {};
              simpleBinding[binding.key] = binding.execute;
              self.simpleKeyBindings.set(simpleBinding);
            }
          });
        }
      });
      
      self.addSimpleKeyBindings([
        {
          key: 'ESC',
          cmd: 'quit',
          alwaysInToolbar: true,
          execute: function() {
            if (onQuit) onQuit();
          }
        },
        {
          key: 'R',
          cmd: 'remix',
          execute: function() {
            mixMaster.replaceFocusedElementWithDialog({
              input: self,
              dialogURL: jQuery.webxraySettings.url("easyRemixDialogURL"),
              sendFullDocument: true
            });
          }
        },
        {
          key: 'C',
          cmd: 'css-quasimode'
        },
        {
          key: 'DELETE',
          cmd: 'remove',
          execute: function() {
            mixMaster.deleteFocusedElement();
          }
        },
        {
          key: 'LEFT',
          cmd: 'undo',
          alwaysInToolbar: true,
          execute: function() { mixMaster.undo(); }
        },
        {
          key: 'RIGHT',
          cmd: 'redo',
          alwaysInToolbar: true,
          execute: function() { mixMaster.redo(); }
        },
        {
          key: 'UP',
          cmd: 'dom-ascend',
          execute: function() { focused.upfocus(); }
        },
        {
          key: 'DOWN',
          cmd: 'dom-descend',
          execute: function() {
            focused.downfocus();
          }
        },
        {
          key: 'H',
          cmd: 'help',
          alwaysInToolbar: true,
          execute: function() {
            self.showKeyboardHelp();
          }
        },
        {
          key: 'B',
          cmd: 'bug-report',
          execute: function() {
            jQuery.openBugReportDialog(self);
          }
        },
        {
          key: 'P',
          cmd: 'uproot',
          alwaysInToolbar: true,
          execute: function() {
            persistence.saveHistoryToDOM();
            jQuery.openUprootDialog(self);
          }
        },
        {
          key: 'I',
          execute: function() {
            mixMaster.infoForFocusedElement();
          }
        }
      ]);

      self.add(self.simpleKeyBindings.handlers);
      self.add(touchInputHandlers(focused));
      self.add(styleOverlayInputHandlers({
        styleInfoOverlay: styleInfo,
        lockForEditingKey: 'SPACE',
        quasimodeKey: 'C'
      }));
      
      return self;
    }
  });
})(jQuery);
