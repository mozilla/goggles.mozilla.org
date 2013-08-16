"use strict";

module("command-manager");

test("ChangeAttributeCmd", function() {
  var $ = jQuery;
  var cmdMgr = jQuery.commandManager();
  var element = $('<p></p>')[0];
  
  $(document.body).append(element);

  cmdMgr.run("ChangeAttributeCmd", {
    element: element,
    name: "change style",
    attribute: "style",
    value: "font-size: 36pt"
  });
  equals($(element).attr("style"), "font-size: 36pt");
  cmdMgr.run("ChangeAttributeCmd", {
    element: element,
    name: "change style",
    attribute: "style",
    value: "font-size: 36pt; color: pink;"
  });
  equals($(element).attr("style"), "font-size: 36pt; color: pink;");
  cmdMgr.undo();
  equals($(element).attr("style"), "font-size: 36pt");
  cmdMgr.undo();
  equals($(element).attr("style"), undefined);
  cmdMgr.redo();
  equals($(element).attr("style"), "font-size: 36pt");
  cmdMgr.redo();
  equals($(element).attr("style"), "font-size: 36pt; color: pink;");

  var recording = cmdMgr.getRecording();

  $(element).remove();
  element = $('<p></p>')[0];
  $(document.body).append(element);

  cmdMgr = jQuery.commandManager();
  cmdMgr.playRecording(recording);
  equals($(element).attr("style"), "font-size: 36pt; color: pink;");
  cmdMgr.undo();
  equals($(element).attr("style"), "font-size: 36pt");
  cmdMgr.undo();
  equals($(element).attr("style"), undefined);
  
  ok(!cmdMgr.canUndo());
  
  $(element).attr("style", "");
  cmdMgr.run("ChangeAttributeCmd", {
    element: element,
    name: "change style",
    attribute: "style",
    value: "font-size: 36pt"
  });
  equals($(element).attr("style"), "font-size: 36pt");
  cmdMgr.undo();
  equals($(element).attr("style"), "");
  $(element).remove();
});

test("jQuery.commandManager()", function() {
  var log = [];
  
  function genericCmd(name, options) {
    var x = options.state ? options.state.x : options.x;
    return {
      name: name,
      execute: function() { log.push("execute " + name + " x:" + x); },
      undo: function() { log.push("undo " + name + " x:" + x); },
      serialize: function() { return {x: x}; }
    };
  }

  function cmdA(options) { return genericCmd("A", options); }
  function cmdB(options) { return genericCmd("B", options); }
  
  function makeCommandManager() {
    var cmdMgr = jQuery.commandManager();
  
    cmdMgr.register(cmdA, "cmdA");
    cmdMgr.register(cmdB, "cmdB");

    return cmdMgr;
  }
  
  var cmdMgr = makeCommandManager();
  
  equal(cmdMgr.canUndo(), false, "canUndo() returns false");
  equal(cmdMgr.canRedo(), false, "canRedo() returns false");

  cmdMgr.run("cmdA", {x: 1});
  cmdMgr.run("cmdB", {x: 5});

  equal(cmdMgr.canRedo(), false, "canRedo() still returns false");
  equal(cmdMgr.canUndo(), true, "canUndo() returns true");

  deepEqual(log, ["execute A x:1", "execute B x:5"],
            "different constructors are registered " +
            "and executed properly");

  log = [];

  cmdMgr.undo();

  equal(cmdMgr.canRedo(), true, "canRedo() returns true");

  cmdMgr.redo();

  deepEqual(log, ["undo B x:5", "execute B x:5"],
            "undo/redo are logged properly.");

  log = [];

  var serialized = cmdMgr.serializeUndoStack();
  deepEqual(log, ["undo B x:5", "undo A x:1",
                  "execute A x:1", "execute B x:5"],
            "different constructors are undone/exec'd properly " +
            "during serializeUndoStack()");
  log = [];

  deepEqual(JSON.parse(serialized),
            [{x: 5, __cmd__:"cmdB"},
             {x: 1, __cmd__:"cmdA"}],
            "different constructors are serialized properly");
  
  cmdMgr = makeCommandManager();
  cmdMgr.deserializeUndoStack(serialized);
  deepEqual(log, ["undo B x:5", "undo A x:1",
                  "execute A x:1", "execute B x:5"],
            "different constructors are undone/exec'd properly" +
            "during deserializeUndoStack()");
});
