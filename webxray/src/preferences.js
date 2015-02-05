(function() {
  var fallback = function() {
    window.parent.postMessage("{}", "*");
  };
  try {
    if (!!localStorage["webxrayPreferences"])
      window.parent.postMessage(localStorage.webxrayPreferences, "*");
    else
      fallback();
  } catch (e) { fallback(); }
}());
