// requirejs setup to use for the front-end in the homepage
requirejs.config({
  baseDir:'/js',
  paths: {
    'jquery':           '/bower/jquery/jquery',
    'text':             '/bower/text/text',
    'localized':        '/bower/webmaker-i18n/localized'
  }
});

require(['/bower/webmaker-ui/ui.js'],
  function (UI) {
    'use strict';

    var langSelector = document.querySelector('#lang-picker');

    // URL redirector for language picker
    UI.langPicker(langSelector);
});
