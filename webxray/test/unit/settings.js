"use strict";

module("settings");

test("jQuery.webxraySettings.url()", function() {
  var oldBaseURI = jQuery.webxraySettings.baseURI;
  jQuery.webxraySettings.extend({
    testRelativeURL: "blarg",
    testAbsoluteHTTPSURL: "https://blarg/",
    testAbsoluteHTTPURL: "http://blarg/",
    baseURI: "http://foo/"
  });
  equal(jQuery.webxraySettings.url("testAbsoluteHTTPURL"),
        "http://blarg/", "url() works on absolute HTTP URLs");
  equal(jQuery.webxraySettings.url("testAbsoluteHTTPSURL"),
        "https://blarg/", "url() works on absolute HTTPS URLs");
  equal(jQuery.webxraySettings.url("testRelativeURL"),
        "http://foo/blarg", "url() works on relative URLs");
  jQuery.webxraySettings.baseURI = oldBaseURI;
});
