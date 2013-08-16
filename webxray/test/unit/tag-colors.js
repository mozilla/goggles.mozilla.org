"use strict";

module("tag-colors");

test("jQuery.colorForTag()", function() {
  var $ = jQuery;

  var iframe = $('<iframe src="palette.html"></iframe>');
  var numTagsTested = 0;

  $(iframe).hide().load(function() {
    start();
    var iframeJQuery = iframe.get(0).contentWindow.jQuery;
    iframeJQuery("li").each(function() {
      var hex = iframeJQuery(this).find(".hex").text();
      var tag = iframeJQuery(this).find(".tag").text();
      if (hex == "" || tag == "")
        ok(0, "assertion failure, hex and tag should be nonempty");
      equals($.colorForTag(tag), hex,
             "tag '" + tag + "' has color " + hex);
      numTagsTested++;
    });
    equals(numTagsTested, $.NUM_TAG_COLORS,
           "palette should have NUM_TAG_COLORS entries");
    equals($.colorForTag("apoengeg"), "#00AEEF",
           "random unknown tag names work");
    $(iframe).remove();
  });
  $(document.body).append(iframe);
  stop(2000);
});

test("overlayWithTagColor()", function() {
  var $ = jQuery;
  
  var overlay = $(document.body).overlayWithTagColor(0.5);
  ok(overlay.css("background-color"), "background-color is non-null");
  overlay.remove();
});
