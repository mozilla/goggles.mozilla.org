module('help');

test('jQuery.createKeyboardHelpReference()', function() {
  var input = jQuery.xRayInput({});
  var overlay = jQuery.createKeyboardHelpReference(input.keyboardHelp);
  equal(overlay.length, 1, 'returns an element');
});
