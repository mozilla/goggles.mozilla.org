"use strict";

module('ui');

test('jQuery.xRayUI()', function() {
  var fakeEventSource = {
    addEventListener: function() {},
    removeEventListener: function() {}
  };
  var ui = jQuery.xRayUI({eventSource: fakeEventSource});
  ui.start();
  ok(ui, "instantiation doesn't throw");
  ui.unload();
  ok(true, "unloading doesn't throw");
  ui.unload();
  ok(true, "unloading twice doesn't throw");
});
