var Webxray = (function() {
  "use strict";

  var GLOBAL_GOGGLES_LOAD_CB = 'webxrayWhenGogglesLoad';

  return {
    _getBaseURI: function() {
      // We would use document.baseURI, but it's not supported on IE9.
      var a = document.createElement("a");
      a.setAttribute("href", "./");
      return a.href;
    },
    getBookmarkletURL: function getBookmarkletURL(baseURI, lang) {
      baseURI = baseURI || this._getBaseURI();

      var baseCode = "(function(){var script=document.createElement('script');script.src='-baseuri-/"+lang+"/webxray.js';script.className='webxray';script.dataset.lang='"+lang+"';script.dataset.baseuri='-baseuri-/"+lang+"';document.body.appendChild(script);})();";
      var code = baseCode.replace( /-baseuri-/g, baseURI );
      
      return 'javascript:' + code;
    },
    whenLoaded: function whenLoaded(cb, global) {
      global = global || window;
      global[GLOBAL_GOGGLES_LOAD_CB] = cb;
    },
    triggerWhenLoaded: function triggerWhenLoaded(ui, global) {
      global = global || window;
      if (GLOBAL_GOGGLES_LOAD_CB in global &&
          typeof(global[GLOBAL_GOGGLES_LOAD_CB]) == 'function')
        global[GLOBAL_GOGGLES_LOAD_CB](ui);
    }
  };
})();
