"use strict";

module("json");

test("JSON.stringify()", function() {
  var obj = {foo:['a', 'b']};
  var expectedJSON = '{"foo":["a","b"]}';

  var revert = Array.prototype.toJSON;
  delete Array.prototype.toJSON;

  equal(JSON.stringify(obj), expectedJSON, 
      "safe stringify works as expected without Array.prototype.toJSON");

  // some versions of Prototype.js (1.6.1 at least) define an 
  // Array.prototype.toJSON that messes up stringification
  Array.prototype.toJSON = function(value) {
    return "oops";
  }

  notEqual(JSON._unsafeStringify(obj), expectedJSON,
      "unsafe stringify does not produce expected JSON");
  equal(JSON.stringify(obj), expectedJSON, 
      "safe stringify works as expected with Array.prototype.toJSON");

  Array.prototype.toJSON = revert;
});
