"use strict";

module("utils", htmlFixture("utils"));

test("isVoidElement()", function() {
  equal(jQuery('<img>').isVoidElement(), true,
        'returns true on void elements');
  equal(jQuery('<div></div>').isVoidElement(), false,
        'returns false on not-void elements');
});

test("outerHtml()", function() {
  var html = '<div class="blah">hi</div>';
  var element = jQuery(html);
  equal(element.outerHtml(), html, "works w/ one matched element");

  var moreHtml = '<div class="foo">bop</div>';
  equal(element.add(jQuery(moreHtml)).outerHtml(), html + moreHtml,
        "works w/ more than one matched element");
});

test("emit()", function() {
  var stuff = jQuery("<div></div>");
  stuff.emit("hello ", jQuery("<em>there</em>"), " dude");
  equal(stuff.html(), "hello <em>there</em> dude",
        "emit() appends text nodes and HTML");
});

test("overlay()", function() {
  var overlay = jQuery("#qunit-header").overlay();
  ok(overlay.hasClass("webxray-overlay"),
     "overlay has the 'webxray-overlay' class");
  ok(true, "overlay() does not throw");
  overlay.remove();
});

test("ancestor()", function() {
  ok(jQuery("#qunit-header").ancestor(1).get(0) === window.document.body,
     "ancestor() works w/ non-null result");
  ok(jQuery("#qunit-header").ancestor(30) === null,
     "ancestor() works w/ null result");
});

test("temporarilyRemove()", function() {
  var div = jQuery("<div><p>hello</p><span>hi</span></div>");
  var p = div.find("p").get(0);
  var removal = jQuery(p).temporarilyRemove();
  equals(div.html(), "<span>hi</span>");
  removal.undo();
  equals(div.html(), "<p>hello</p><span>hi</span>");
  ok(p === div.find("p").get(0));
});

test("pathTo()", function() {
  var $ = jQuery;
  $("#qunit-fixture #utils .test-case").each(function() {
    var root = this;
    
    var expect = $(root).attr("data-expect");
    var target = $(root).find('[data-target="true"]').get(0);
    var actual = $(root).pathTo(target);
    equals(actual, expect, "actual CSS path is same as expected");

    var matches = $(root).find(expect);
    if (matches.length != 1)
      throw new Error("expected path does not uniquely identify the element!");
    if (matches.get(0) !== target)
      throw new Error("expected path is not actually valid!");
  });
});

test("jQuery.loadScript()", function() {
  var js = "jQueryLoadScriptSuccessful=true;";

  delete window.jQueryLoadScriptSuccessful;
  jQuery.loadScript("data:application/javascript," + js).done(function() {
    equal(window.jQueryLoadScriptSuccessful, true);
    delete window.jQueryLoadScriptSuccessful;
    start();
  });
  stop();
});

test("jQuery.shortenText()", function() {
  equals(jQuery.shortenText('hello', 3), 'hel\u2026');
  equals(jQuery.shortenText('hello', 5), 'hello');
  equals(jQuery.shortenText('hello', 200), 'hello');
});

test("jQuery.makeRGBA()", function() {
  equals(jQuery.makeRGBA("rgb(120, 255, 255)", 0.5),
         "rgba(120, 255, 255, 0.5)",
         "works w/ rgb() triples");
  equals(jQuery.makeRGBA("rgb(120,255,255)", 0.5),
         "rgba(120, 255, 255, 0.5)",
         "works w/ rgb() triples w/o whitespace");
  equals(jQuery.makeRGBA("#ffaaff", 1.0), "rgba(255, 170, 255, 1)",
         "works with lowercase hex colors");
  equals(jQuery.makeRGBA("#FFAAFF", 1.0), "rgba(255, 170, 255, 1)",
         "works with uppercase hex colors");
         
  var div = jQuery('<div style="color: #C60C46;"></div>');
  jQuery(document.body).append(div);
  equals(jQuery.makeRGBA(div.css("color"), "0.5"),
         "rgba(198, 12, 70, 0.5)",
         "works with css('color') on this browser");
  div.remove();
});

test("absolutifyURLs()", function() {
  var $ = jQuery;

  var a = $('<a href="/blah">test</a>');
  if (!a[0].href.match(/.+\/blah$/))
    throw new Error("Expected href property to be absolute!");
  if (a.attr("href") == a[0].href)
    throw new Error("Expected href attribute to != href property!");
  a.absolutifyURLs();
  if (!a[0].href.match(/.+\/blah$/))
    throw new Error("Expected href property to be absolute!");
  equal(a[0].href, a.attr("href"), "URLs in hrefs are absolutified");

  a = $('<img src="/blah">test</img>');
  if (!a[0].src.match(/.+\/blah$/))
    throw new Error("Expected src property to be absolute!");
  if (a.attr("src") == a[0].src)
    throw new Error("Expected src attribute to != src property!");
  a.absolutifyURLs();
  if (!a[0].src.match(/.+\/blah$/))
    throw new Error("Expected src property to be absolute!");
  equal(a[0].src, a.attr("src"), "URLs in srcs are absolutified");

  a = $('<div><img src="/blah">test</img></div>');
  a.absolutifyURLs();
  a = a.find('img');
  equal(a[0].src, a.attr("src"), "URLs in child srcs are absolutified");
});

test("reallyRemoveClass()", function() {
  var $ = jQuery;

  var a = $('<div class="foo"></div>');
  var b = a.clone();

  equal('<div class=""></div>', a.removeClass('foo').outerHtml());
  equal('<div></div>', b.reallyRemoveClass('foo').outerHtml());
});
