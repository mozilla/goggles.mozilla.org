(function() {
  "use strict";

  var hostname = document.getElementById("browser-screen").getAttribute("data-hostname");
  var localeInfo = document.getElementById("browser-screen").getAttribute("data-localeInfo");

  $(window).ready(function() {

    $("#bookmarklet-link").attr("href", Webxray.getBookmarkletURL(hostname, localeInfo));

    $("#bookmarklet-link").on("click", function(event) {
      event.preventDefault();
      var script = document.createElement('script');
      script.src = '/webxray.js';
      script.className = 'webxray';
      script.setAttribute('data-lang',localeInfo);
      script.setAttribute('data-baseuri', hostname + "/"+localeInfo);
      document.body.appendChild(script);
    });

    // browser-specific screenshots
    // http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // At least Safari 3+: "[object HTMLElementConstructor]"
    var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
    var isIE = /*@cc_on!@*/false || document.documentMode;   // At least IE6
    var browser = "firefox";

    if (isChrome) {
      browser = "chrome";
    } else if (isSafari) {
      browser = "safari";
    }

    $('#install .screenshot.step1 img').attr('src', 'img/instructions/' + browser + '1.png');
    $('#install .screenshot.step2 img').attr('src', 'img/instructions/' + browser + '2.png');
    $('.screenshot').fadeIn();
  });

}());
