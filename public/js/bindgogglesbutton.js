var gogglesBaseURI = window.location.protocol + "//" + window.location.host;

var bookmarklet = (function() {
  var script=document.createElement('script');
  script.src=gogglesBaseURI+'/webxray.js';
  script.className='webxray';
  script.setAttribute('data-lang','en-US');
  script.setAttribute('data-baseuri',gogglesBaseURI);
  document.body.appendChild(script);
}).toString();

bookmarklet = bookmarklet.replace(/gogglesBaseURI/g, "'" + gogglesBaseURI + "'");

var lines = bookmarklet.split("\n").map(function(s) { return s.trim(); });
var a = document.querySelector("a.goggles-bookmark");
a.href = "javascript:(" + lines.join('') + "())";

// make sure we can't accidentally click the link and activate the goggles
a.addEventListener("click", function(evt) {
  evt.stopPropagation();
  evt.preventDefault;
  return false;
});

a.onclick = function() { return false; };
