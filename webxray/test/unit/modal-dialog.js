"use strict";

module("modal-dialog");

test("jQuery.getModalDialogDimensions()", function() {
  var d = jQuery.getModalDialogDimensions();
  ok(d.top >= 0, "top is >= 0");
  ok(d.left >= 0, "left is >= 0");
  ok(d.width > 0, "width is > 0");
  ok(d.height > 0, "height is > 0");
  equals(jQuery(".webxray-dialog-overlay").length, 0,
         "dialog overlay is not in DOM");
});
