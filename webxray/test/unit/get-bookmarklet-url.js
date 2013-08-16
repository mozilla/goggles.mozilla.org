"use strict";

module("get-bookmarklet-url");

test("Webxray._getBaseURI()", function() {
  ok(Webxray._getBaseURI().match(/^https?:.*\/$/),
     "returns an absolute URL to a directory: " + Webxray._getBaseURI());
});

test("Webxray.getBookmarkletURL()", function() {
  ok(Webxray.getBookmarkletURL().indexOf("undefined") == -1,
     "works with no arg");
  ok(Webxray.getBookmarkletURL("blargy").indexOf("blargy") != -1,
     "works with URL arg");
});

test("Webxray.whenLoaded()", function() {
  var global = {};
  var cbCalled = [];
  
  Webxray.triggerWhenLoaded({}, global);
  ok(true, "triggering callback when none registered does nothing");
  Webxray.whenLoaded(function(ui) { cbCalled.push(ui); }, global);
  equal(cbCalled.length, 0, "callback not called on registration");
  ok('webxrayWhenGogglesLoad' in global,
     "callback embedded in global object");
  Webxray.triggerWhenLoaded({blah: 1}, global);
  equal(cbCalled[0].blah, 1, "callback is called with ui object");
  Webxray.whenLoaded(null, global);
  Webxray.triggerWhenLoaded({}, global);
  equal(cbCalled.length, 1, "callback isn't called after unregistration");
});
