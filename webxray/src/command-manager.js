(function(jQuery) {
  "use strict";

  var $ = jQuery;
  
  function CommandManager() {
    var undoStack = [];
    var redoStack = [];

    function serializeCommand(cmd) {
      var state = cmd.serialize();
      state.__cmd__ = cmd.registeredName;
      return state;
    }
    
    function createCommand(name, options) {
      var constructor = registry[name];
      var command = constructor(options);
      command.registeredName = name;
      self.emit('command-created', command);
      return command;
    }
    
    function deserializeCommand(state) {
      // The fallback here is just for backwards compatibility
      // with old-style serializations.
      var name = state.__cmd__ || "ReplaceWithCmd";      
      return createCommand(name, {state: state});
    }
    
    var registry = {};
    
    var self = jQuery.eventEmitter({
      register: function(constructor, name) {
        registry[name] = constructor;
      },
      run: function(name, options) {
        var command = createCommand(name, options);
        undoStack.push(command);
        redoStack.splice(0);
        command.execute();
        self.emit('state-change');
        return command;
      },
      canUndo: function() {
        return (undoStack.length > 0);
      },
      canRedo: function() {
        return (redoStack.length > 0);
      },
      undo: function() {
        var command = undoStack.pop();
        redoStack.push(command);
        command.undo();
        self.emit('state-change');
        return command;
      },
      redo: function() {
        var command = redoStack.pop();
        undoStack.push(command);
        command.execute();
        self.emit('state-change');
        return command;
      },
      getRecording: function() {
        var recording = [];
        var timesUndone = 0;
        while (undoStack.length) {
          var cmd = undoStack[undoStack.length - 1];
          self.undo();
          recording.splice(0, 0, serializeCommand(cmd));
          timesUndone++;
        }
        for (var i = 0; i < timesUndone; i++)
          self.redo();
        return JSON.stringify(recording);
      },
      playRecording: function(recording) {
        recording = JSON.parse(recording);
        undoStack.splice(0);
        redoStack.splice(0);
        for (var i = 0; i < recording.length; i++) {
          var cmd = deserializeCommand(recording[i]);
          undoStack.push(cmd);
          cmd.execute();
        }
      },
      serializeUndoStack: function() {
        var commands = [];
        var timesUndone = 0;
        while (undoStack.length) {
          var cmd = undoStack[undoStack.length - 1];
          commands.push(serializeCommand(cmd));
          self.undo();
          timesUndone++;
        }
        for (var i = 0; i < timesUndone; i++)
          self.redo();
        return JSON.stringify(commands);
      },
      deserializeUndoStack: function(commands) {
        commands = JSON.parse(commands);
        undoStack.splice(0);
        redoStack.splice(0);
        for (var i = 0; i < commands.length; i++) {
          var cmd = deserializeCommand(commands[i]);
          undoStack.push(cmd);
          self.undo();
        }
        for (var i = 0; i < commands.length; i++)
          self.redo();
      }
    });

    self.register(ReplaceWithCmd, "ReplaceWithCmd");
    self.register(ChangeAttributeCmd, "ChangeAttributeCmd");
    
    return self;
  }
  
  function ChangeAttributeCmd(options) {
    var name = options.name,
        element = options.element,
        attribute = options.attribute,
        value = options.value;

    function deserialize(state) {
      name = state.name;
      attribute = state.attribute;
      value = state.value;
      element = $(document.documentElement).find(state.selector);
    }
    
    if (options.state)
      deserialize(options.state);

    function applyValue() {
      this.emit('before-replace', element);
      var oldValue = $(element).attr(attribute);
      if (typeof(value) == 'undefined')
        $(element).removeAttr(attribute);
      else
        $(element).attr(attribute, value);
      value = oldValue;
      this.emit('after-replace', element);
    }

    return jQuery.eventEmitter({
      name: name,
      execute: applyValue,
      undo: applyValue,
      serialize: function() {
        var selector = $(document.documentElement).pathTo(element);

        return {
          name: name,
          selector: selector,
          attribute: attribute,
          value: value
        };
      }
    });
  }

  function ReplaceWithCmd(options) {
    var name = options.name,
        elementToReplace = options.elementToReplace,
        newContent = options.newContent,
        isExecuted = false;

    function deserialize(state) {
      if (typeof(state.isExecuted) == 'undefined')
        isExecuted = true; // support legacy serializations
      else
        isExecuted = state.isExecuted;
      name = state.name;
      if (isExecuted) {
        newContent = $(document.documentElement).find(state.selector);
        elementToReplace = $(state.html);
        if (newContent.length != 1)
          throw new Error("selector '" + state.selector + "' matches " +
                          newContent.length + " elements");
      } else {
        newContent = $(state.html);
        elementToReplace = $(document.documentElement).find(state.selector);
        if (elementToReplace.length != 1)
          throw new Error("selector '" + state.selector + "' matches " +
                          elementToReplace.length + " elements");
      }
    }

    if (options.state)
      deserialize(options.state);

    return jQuery.eventEmitter({
      name: name,
      execute: function() {
        if (isExecuted)
          throw new Error("command already executed");
        this.emit('before-replace', elementToReplace);
        $(elementToReplace).replaceWith(newContent);
        this.emit('after-replace', newContent);
        isExecuted = true;
      },
      undo: function() {
        if (!isExecuted)
          throw new Error("command not yet executed");
        this.emit('before-replace', newContent);
        $(newContent).replaceWith(elementToReplace);
        this.emit('after-replace', elementToReplace);
        isExecuted = false;
      },
      serialize: function() {
        var selector;
        var html;
        if (isExecuted) {
          selector = $(document.documentElement).pathTo(newContent);
          html = $(elementToReplace).outerHtml();
        } else {
          selector = $(document.documentElement).pathTo(elementToReplace);
          html = $(newContent).outerHtml();
        }
        return {
          isExecuted: isExecuted,
          name: name,
          selector: selector,
          html: html
        };
      }
    });
  }

  jQuery.extend({commandManager: CommandManager});
})(jQuery);
