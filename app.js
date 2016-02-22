var path = require('path');
var habitat = require('habitat');
habitat.load('.env');

var express = require('express');
var app = express();

app.disable("x-powered-by");

// static dir contains webxray.js, which prompts users to rebookmark from goggles.mozilla.org
app.use(express.static(path.join(__dirname, "public")));

// and anything else redirects the user to the new goggles website
app.use(function(req, res) {
  res.redirect('https://goggles.mozilla.org');
});

// we do so very little. But we do exactly enough.
app.listen(process.env.PORT, function(){
  console.log('Express server listening on port ' + process.env.PORT);
});
