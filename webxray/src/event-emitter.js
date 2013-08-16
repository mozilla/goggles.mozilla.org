(function(jQuery) {
  "use strict";

  jQuery.eventEmitter = function eventEmitter(object) {
    var handlers = {};

    object.emit = function emit(event, data) {
      if (event in handlers)
        handlers[event].forEach(function(handler) {
          handler(data);
        });
    };
    
    object.on = object.addListener = function on(event, handler) {
      if (!(event in handlers))
        handlers[event] = [];
      handlers[event].push(handler);
    };
    
    object.removeListener = function removeListener(event, handler) {
      if (event in handlers) {
        var index = handlers[event].indexOf(handler);
        if (index != -1)
          handlers[event].splice(index, 1);
      }
    };
    
    object.removeAllListeners = function removeAllListeners(type) {
      if (type in handlers)
        delete handlers[type];
    };

    return object;
  };
})(jQuery);
