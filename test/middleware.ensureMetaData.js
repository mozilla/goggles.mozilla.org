var assert = require("assert");

var fakeEnv = {
  get: function() {}
}
var ensureMetaData = require("../lib/middleware")(fakeEnv).ensureMetaData;
var mockReq = JSON.stringify({
  body: {
    "original-url": "http://example.com"
  },
  session: {
    user: {
      username: "webmaker"
    }
  }
});

(function() {
  var req = JSON.parse(mockReq);
  req.body.html = "<title>Hello world</title>";

  ensureMetaData(req, null, function test() {
    assert.equal(req.body.metaData.title, "Hello world");
    assert.equal(req.body.metaData.description, "An X-Ray Goggles remix of Hello world");
  });
}());

(function() {
  var req = JSON.parse(mockReq);
  req.body.html = "<title dir=\"ltr\">Hello world</title>";

  ensureMetaData(req, null, function test() {
    assert.equal(req.body.metaData.title, "Hello world");
    assert.equal(req.body.metaData.description, "An X-Ray Goggles remix of Hello world");
  });
}());

(function() {
  var req = JSON.parse(mockReq);
  req.body.html = "<title></title>";

  ensureMetaData(req, null, function test() {
    assert.equal(req.body.metaData.title, "http://example.com");
    assert.equal(req.body.metaData.description, "An X-Ray Goggles remix of http://example.com");
  });
}());

(function() {
  var req = JSON.parse(mockReq);
  req.body.html = "<title>a\nnewline</title>";

  ensureMetaData(req, null, function test() {
    assert.equal(req.body.metaData.title, "a\nnewline");
    assert.equal(req.body.metaData.description, "An X-Ray Goggles remix of a\nnewline");
  });
}());
