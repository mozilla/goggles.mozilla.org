"use strict";

module("mix-master");

test("jQuery.mixMaster()", function() {
  var $ = jQuery;

  function testWithElement(element, fn) {
    var hud = $.hudOverlay({defaultContent: "hai2u"});
    var focused = jQuery.focusedOverlay();

    var domNode = element.children().get(0);
    focused.set(domNode);

    var cmdMgr = jQuery.commandManager();
    var mixMaster = $.mixMaster({
      locale: jQuery.localization.createLocale(["en-US"]),
      hud: hud, 
      focusedOverlay: focused,
      commandManager: cmdMgr,
      disableTransitionEffects: true
    });
    
    fn(mixMaster, element, hud, focused, cmdMgr);

    focused.destroy();
    hud.destroy();
  }

  function makeTestElement() {
    var element = $('<div><div id="mixmastertest"></div></div>');
    $(document.body).append(element);
    
    return element;
  }
  
  function mixTest(fn) {
    var element = makeTestElement();
    testWithElement(element, fn);

    element.remove();
  }

  (function testRecording() {
    function makeSpan() {
      var element = $('<span><div id="mixmastertest"></div></span>');
      $(document.body).append(element);

      return element;
    }
    
    var element = makeSpan();
    var recording, recordingJS;
    
    testWithElement(element, function(mixMaster, element, hud, focused,
                                      commandManager) {
      mixMaster.replaceElement(focused.getPrimaryElement(), '<em>hi</em>');
      focused.set(element.children().get(0));
      mixMaster.replaceElement(focused.getPrimaryElement(), '<span>u</span>');
      recording = commandManager.getRecording();
      equals(element.html(), '<span>u</span>',
             'getRecording() doesn\'t change DOM');
    });
    
    equals(typeof(recording), 'string', "recording is a string");
    element.remove();
    element = makeSpan();

    function testPlayRecording() {
      testWithElement(element, function(mixMaster, element, hud, focused,
                                        commandManager) {
        commandManager.playRecording(recording);
        equals(element.html(), '<span>u</span>',
               'playRecording() transforms DOM as expected');
        mixMaster.undo();
        equal(element.html(), '<em>hi</em>');
        mixMaster.undo();
        equal(element.html(), '<div id="mixmastertest"></div>');
      });
    }
    
    testPlayRecording();
    element.remove();
    element = makeSpan();

    testPlayRecording();
    element.remove();
  })();
  
  (function testSerialization() {
    var element = makeTestElement();
    var history;
    
    testWithElement(element, function(mixMaster, element, hud, focused,
                                      commandManager) {
      mixMaster.replaceElement(focused.getPrimaryElement(), '<em>hi</em>');
      focused.set(element.children().get(0));
      mixMaster.replaceElement(focused.getPrimaryElement(), '<span>u</span>');
      history = commandManager.serializeUndoStack();
      equals(element.html(), '<span>u</span>',
             'serializeUndoStack() doesn\'t change DOM');
    });
    
    equals(typeof(history), 'string', "history is a string");

    testWithElement(element, function(mixMaster, element, hud, focused,
                                      commandManager) {
      commandManager.deserializeUndoStack(history);
      equals(element.html(), '<span>u</span>',
             'deserializeUndoStack() doesn\'t change DOM');
      mixMaster.undo();
      equal(element.html(), '<em>hi</em>');
      mixMaster.undo();
      equal(element.html(), '<div id="mixmastertest"></div>');
    });

    element.remove();
  })();

  mixTest(function(mixMaster, element, hud, focused, commandManager) {
    var persistence = jQuery.commandManagerPersistence(commandManager);
    equal($('#webxray-serialized-history-v1').length, 0);
    mixMaster.replaceElement(focused.getPrimaryElement(), '<p>hi</p>');
    persistence.saveHistoryToDOM();
    equal($('#webxray-serialized-history-v1').length, 1);
    ok($('#webxray-serialized-history-v1').text().length);

    var cmdMgr = jQuery.commandManager();
    var mm = jQuery.mixMaster({
      hud: hud,
      focusedOverlay: focused,
      commandManager: cmdMgr
    });
    
    persistence = jQuery.commandManagerPersistence(cmdMgr);
    persistence.loadHistoryFromDOM();
    equal($('#webxray-serialized-history-v1').length, 1,
          "existing history DOM is not removed after load");
    equal(element.html(), '<p>hi</p>',
          "loading history doesn't change DOM");
    mm.undo();
    equal(element.html(), '<div id="mixmastertest"></div>',
          "undo history is loaded properly");
    
    var oldHistory = $('#webxray-serialized-history-v1').text();
    persistence.saveHistoryToDOM();
    equal($('#webxray-serialized-history-v1').length, 1,
          "history DOM exists after save");
    ok($('#webxray-serialized-history-v1').text() != oldHistory,
       "history DOM is replaced after save");

    $('#webxray-serialized-history-v1').text('garbage');
    persistence.loadHistoryFromDOM();
    ok(true, "loadHistoryFromDOM() with bogus history data doesn't throw");
    
    $('#webxray-serialized-history-v1').remove();
  });
  
  mixTest(function(mixMaster, element, hud, focused) {
    var domNode = element.find("#mixmastertest").get(0);

    mixMaster.replaceElement(focused.getPrimaryElement(), '<em>hello</em>');
    equal(element.html(), '<em>hello</em>', "Simulating replacement works");
    equal($(hud.overlay).text(), 'Executed replacement.');

    mixMaster.undo();
    equal(element.find("#mixmastertest").length, 1,
          "Simulating undo works");
    equal($(hud.overlay).text(), 'Undid replacement.');

    ok(element.find("#mixmastertest").get(0) === domNode,
       "Undo restores original DOM node, not just HTML.");

    mixMaster.redo();

    equal(element.find("#mixmastertest").length, 0,
          "Simulating redo works");
    equal($(hud.overlay).text(), 'Redid replacement.');
  });

  mixTest(function(mixMaster) {
    var infoURL;
    mixMaster.infoForFocusedElement(function open(url) { infoURL = url; });
    equal(infoURL, 'https://developer.mozilla.org/en/HTML/Element/div',
          'info URL is correct');
  });

  mixTest(function(mixMaster, element, hud) {
    mixMaster.deleteFocusedElement();
    equal(element.html(), '<span class="webxray-deleted"></span>',
          "Simulating deletion works");
    equal($(hud.overlay).text(), 'Executed deletion.');
  });
});
