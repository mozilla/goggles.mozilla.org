"use strict";

module("hud-overlay", htmlFixture('hud-overlay'));

test("jQuery.hudOverlay() defaultContent works", function() {
  var $ = jQuery;
  var hud = $.hudOverlay({defaultContent: "hai2u"});
  equals($(hud.overlay).html(), "hai2u");
  hud.destroy();
});

test("onFocusChange()", function() {
  var locale = jQuery.localization.createLocale(["en-US"]);
  var $ = jQuery;
  var hud = $.hudOverlay({locale: locale});
  $("#qunit-fixture #hud-overlay .test-case").each(function() {
    var element = $(this).find(".element").children();
    var ancestor = $(this).find(".ancestor").children();
    var focused = {
      element: element.length ? element.get(0) : null,
      ancestor: ancestor.length ? ancestor.get(0) : null
    };
    hud.onFocusChange(focused);
    equals($(this).find(".expect").html(), $(hud.overlay).html());
  });
  hud.destroy();
});
