(function( originalWindow, undefined ) {

var window = originalWindow;

// Use the correct document accordingly with window argument (sandbox)
var document = window.document;

// This value is computed at build time.
var buildMetadata = __BUILD_METADATA__;

// We might be monkeypatching JSON later; if we do, ensure it's
// our own private copy of JSON rather than the page's global one.
var JSON = {
  stringify: window.JSON && window.JSON.stringify,
  parse: window.JSON && window.JSON.parse
};
