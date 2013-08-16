"use strict";

module("blur-indicator");

test("jQuery.blurIndicator()", function() {
  var $ = jQuery;
  var field = $('<input type="text">');
  var body = $('<div></div>');
  var timesActivated = 0;
  var timesDeactivated = 0;
  var fakeInput = jQuery.eventEmitter({
    activate: function() { timesActivated++; },
    deactivate: function() { timesDeactivated++; }
  });
  $(document.body).append(field);
  var blur = jQuery.blurIndicator(fakeInput, field, body);
  field.focus();
  fakeInput.emit('activate');
  equals(body.find('.webxray-dialog-overlay').length, 0,
         "overlay is not present when field is focused");
  field.blur();
  equals(timesDeactivated, 1, "input is deactivated on blur");
  equals(body.find('.webxray-dialog-overlay').length, 1,
         "overlay is present when field is blurred");
  field.focus();
  equals(timesActivated, 1, "input is re-activated on focus");
  field.remove();
  setTimeout(function() {
    equals(body.find('.webxray-dialog-overlay').length, 0,
           "overlay is removed on focus");
    start();
  }, 50);
  stop();
});
