(function() {
  var topBarHTML = '<div class="hackpub-top-bar">' +
    '<span class="desc">This page is a remix of <a class="original"></a> ' +
    'using the <a href="" class="goggles">Web X-Ray Goggles</a>, part of ' +
    'the <a href="http://hackasaurus.org">Hackasaurus</a> toolkit.</span>' +
    '<div class="close-button"></div>' +
    '</div>';

  function whenScriptsLoaded() {
    $(document.head).append('<link rel="stylesheet" href="' +
                            path('top-bar.css') + '">');
    var topBar = $(topBarHTML);
    var original = $("a.original", topBar);
    original.attr("href", hackpubInfo.originalURL);
    original.text(original[0].hostname);
    
    function removeTopBar() {
      topBar.fadeOut(function() { topBar.remove(); });
    }
    
    $("a.goggles", topBar)
      .attr("href", Webxray.getBookmarkletURL(path('../')))
      .click(removeTopBar);
    $(".close-button", topBar).click(removeTopBar);
    $(document.body).append(topBar);
  }

  function path(url) {
    var baseURL = hackpubInfo.injectURL.match(/(.*)injector\.js$/)[1];
    return baseURL + url;
  }

  window.addEventListener("load", function onLoad() {
    scriptsToLoad = [
      "../jquery.min.js",
      "../src/get-bookmarklet-url.js"
    ].reverse();

    function loadNextScript() {
      if (scriptsToLoad.length) {
        var scriptPath = scriptsToLoad.pop();
          var script = document.createElement("script");

          script.setAttribute("src", path(scriptPath));
          script.onload = loadNextScript;
          document.body.appendChild(script);
      } else {
        whenScriptsLoaded();
      }
    }

    window.removeEventListener("load", onLoad, false);
    loadNextScript();
  }, false);
})();
