module("style-info");

test("jQuery.fn.getStyleInfo()", function() {
  var $ = jQuery;
  var info = $(document.documentElement).getStyleInfo();
  var fakeHud = $("<div></div>");
  jQuery.localization.extend("en", "css-property-docs", {
    "background-color": "HI THERE"
  });
  var locale = jQuery.localization.createLocale(["en"]);
  equal(info.find(".webxray-value-different-from-parent").length, 0,
        "HTML element has no 'value different from parent' class");

  var element = $('<p style="background-color: firebrick"></p>');
  $(document.body).append(element);
  info = element.getStyleInfo(null, locale, {overlay: fakeHud});
  var diff = info.find(".webxray-value-different-from-parent")
                 .prev(":contains('background\u2011color')");
  equal(diff.length, 1,
        "values different from parent have expected class");
  element.remove();
  
  equal(fakeHud.html(), "", "HUD should have nothing by default");
  diff.parent().trigger("mouseover");
  ok(fakeHud.html().indexOf("HI THERE") != -1,
     "HUD should have CSS docs on mouseover");
});

test("jQuery.cssHooks", function() {
  var $ = jQuery;
  var div = $('<div></div>');
  div.attr('style', "background-image: url(http://mozilla.org/favicon.ico)");
  equal(jQuery.normalizeStyleProperty(div[0].style, 'background-image'),
        'http://mozilla.org/favicon.ico',
        'jQuery.normalizeStyleProperty() strips url()');
  div.css('background-image', 'http://mozilla.org/favicon.ico2');
  equal(jQuery.normalizeStyleProperty(div[0].style, 'background-image'),
        'http://mozilla.org/favicon.ico2',
        'jQuery.cssHooks.backgroundImage sets url()');
  div.css('background-image', 'url(http://mozilla.org/favicon.ico3)');
  equal(jQuery.normalizeStyleProperty(div[0].style, 'background-image'),
        'http://mozilla.org/favicon.ico3',
        'jQuery.cssHooks.backgroundImage sets url() only when necessary');
});

test("jQuery.styleInfoOverlay()", function() {
  var focused = jQuery.eventEmitter({
    getPrimaryElement: function() {
      return document.documentElement;
    },
    unfocus: function() {
    }
  });
  var input = {
    deactivateCalled: 0,
    activateCalled: 0,
    activate: function() {
      this.activateCalled++;
    },
    deactivate: function() {
      this.deactivateCalled++;
    }
  };
  var overlay = jQuery.styleInfoOverlay({
    focused: focused,
    commandManager: {},
    mouseMonitor: jQuery.mouseMonitor()
  });
  overlay.show();
  focused.emit('change');
  overlay.lock(input);
  equal(input.deactivateCalled, 1,
        "locking overlay deactivates normal input");
  jQuery(".webxray-close-button").click();
  equal(input.activateCalled, 1,
        "clicking on close button reactivates normal input");
  overlay.hide();
});
