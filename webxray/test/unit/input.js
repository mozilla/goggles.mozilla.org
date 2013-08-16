"use strict";

module("input");

test("jQuery.mouseMonitor()", function() {
  var mm = jQuery.mouseMonitor();
  ok(mm.lastPosition.pageX == 0, mm.lastPosition.pageY == 0);
  mm.on('move', function() {});
  mm.unload();
});

test("jQuery.xRayInput() activate/deactivate", function() {
  var $ = jQuery;
  var input = $.xRayInput({eventSource: document});
  
  input.activate();
  ok(true, "activate() does not throw");

  input.deactivate();
  ok(true, "deactivate() does not throw");
});

test("jQuery.xRayInput()", function() {
  var $ = jQuery;
  var prevented = false;
  var stopped = false;

  var event = {
    type: 'keydown',
    shiftKey: false,
    altKey: false,
    keyCode: -1,
    preventDefault: function() { prevented = true; },
    stopPropagation: function() { stopped = true; }
  };

  var log = [];

  function MockObject(options) {
    var obj = {};
    options.methods.forEach(function(name) {
      obj[name] = function() {
        log.push(options.name + "." + name +
                 "() called w/ " + arguments.length + " args");
      }
    });
    return obj;
  }

  function checkLog(expectedLogMessages, message) {
    deepEqual(expectedLogMessages, log, message);
    log.splice(0);
  }

  var input = $.xRayInput({
    mixMaster: MockObject({
      name: 'mixMaster',
      methods: ['undo', 'redo', 'deleteFocusedElement',
                'replaceFocusedElement',
                'infoForFocusedElement',
                'replaceFocusedElementWithDialog']
    }),
    focusedOverlay: MockObject({
      name: 'focusedOverlay',
      methods: ['upfocus', 'downfocus']
    }),
    eventSource: MockObject({
      name: 'eventSource',
      methods: ['addEventListener', 'removeEventListener']
    }),
    onQuit: function() {
      log.push("onQuit() called");
    }
  });

  function times(msg, n) {
    var log = [];
    for (var i = 0; i < n; i++)
      log.push(msg);
    return log;
  }

  input.activate();
  checkLog(times("eventSource.addEventListener() called w/ 3 args", 8),
            'addEventListener() is called on eventSource');

  input.deactivate();
  checkLog(times("eventSource.removeEventListener() called w/ 3 args", 8),
           'removeEventListener() is called on eventSource');

  input.handleEvent(event);
  ok(!prevented, "Typing invalid key doesn't prevent default event handling");
  ok(!stopped, "Typing valid key doesn't stop event propagation");
  checkLog([], 'nothing happens when invalid key pressed');
  
  event.keyCode = $.keys.R;
  input.handleEvent(event);
  ok(prevented, "Typing valid key prevents default event handling");
  ok(stopped, "Typing valid key stops event propagation");
  checkLog(['mixMaster.replaceFocusedElementWithDialog() called w/ 1 args'])

  event.keyCode = $.keys.DELETE;
  input.handleEvent(event);
  checkLog(['mixMaster.deleteFocusedElement() called w/ 0 args'])

  event.keyCode = $.keys.I;
  input.handleEvent(event);
  checkLog(['mixMaster.infoForFocusedElement() called w/ 0 args']);

  event.keyCode = $.keys.ESC;
  input.handleEvent(event);
  checkLog(['onQuit() called'], 'ESC invokes onQuit');

  event.shiftKey = true;
  event.keyCode = $.keys.LEFT;
  input.handleEvent(event);
  checkLog(['mixMaster.undo() called w/ 0 args']);

  event.keyCode = $.keys.RIGHT;
  input.handleEvent(event);
  checkLog(['mixMaster.redo() called w/ 0 args']);

  event.keyCode = $.keys.UP;
  input.handleEvent(event);
  checkLog(['focusedOverlay.upfocus() called w/ 0 args']);

  event.keyCode = $.keys.DOWN;
  input.handleEvent(event);
  checkLog(['focusedOverlay.downfocus() called w/ 0 args']);

  event.altKey = true;
  input.handleEvent(event);
  checkLog([], 'nothing happens when added modifier key is held down');

  event.type = "boop";
  raises(function() {
    input.handleEvent(event);
  }, "unexpected event type throws error");
});
