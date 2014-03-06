// requirejs setup to use for the front-end in the homepage
requirejs.config({
  baseDir:'/js',
  paths: {
    'jquery':           '/bower/jquery/jquery',
    'text':             '/bower/text/text',
    'localized':        '/bower/webmaker-i18n/localized',
    'languages':        '/bower/webmaker-language-picker/js/languages',
    'list':             '/bower/listjs/dist/list.min',
    'fuzzySearch':      '/bower/list.fuzzysearch.js/dist/list.fuzzysearch.min'
  }
});

require(['languages'],
  function (Languages) {
    'use strict';
    // Call this when language picker element is ready.
    Languages.ready({ position: 'bottom', arrow: 'top' }, true);
});
