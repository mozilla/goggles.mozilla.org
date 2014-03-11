(function(){
  if ('webxrayPreferences' in localStorage)
    window.parent.postMessage(localStorage.webxrayPreferences, "*");
  else
    window.parent.postMessage("{}", "*");
}());
