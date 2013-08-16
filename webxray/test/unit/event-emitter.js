"use strict";

module("event-emitter");

test("jQuery.eventEmitter()", function() {
  var emitter = jQuery.eventEmitter({
    myMethod: function() { return 1; }
  });
  
  ok(emitter.myMethod() == 1, "inheritance works");

  var timesCalled = 0;
  function myListener() { timesCalled++; }

  emitter.on('foo', myListener);
  equals(timesCalled, 0, "on() does not call listeners");

  emitter.emit('foo');
  equals(timesCalled, 1, "emit() calls listeners once");

  emitter.emit('bar');
  equals(timesCalled, 1, "emit() calls only relevant listeners");

  emitter.removeListener('foo', myListener);
  emitter.emit('foo');
  equals(timesCalled, 1, "removeListener() works");

  emitter.addListener('foo', myListener);
  emitter.emit('foo');
  equals(timesCalled, 2, "addListener() is a synonym for on()");
  
  emitter.removeAllListeners('foo');
  emitter.emit('foo');
  equals(timesCalled, 2, "removeAllListeners() works");
});
