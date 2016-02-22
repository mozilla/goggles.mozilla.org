var path = require('path');
var habitat = require('habitat');
habitat.load('.env');

var express = require('express');
var app = express();

app.disable("x-powered-by");

// contains webxray.js, which prompts users to rebookmark from goggles.mozilla.org
app.use(express.static(path.join(__dirname, "public")));

// redirect us to the new goggles website
app.get('/', function(req, res) {
  res.redirect('https://goggles.mozilla.org');
});

// we do so very little. But we do exactly enough.
app.listen(process.env.PORT, function(){
  console.log('Express server listening on port ' + process.env.PORT);
});
