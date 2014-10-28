// requirejs setup to use for the front-end in the homepage
requirejs.config({
  baseDir:'/js',
  paths: {
    'analytics':        '/bower/webmaker-analytics/analytics',
    'jquery':           '/bower/jquery/jquery',
    'text':             '/bower/text/text',
    'localized':        '/bower/webmaker-i18n/localized',
    'languages':        '/bower/webmaker-language-picker/js/languages',
    'list':             '/bower/listjs/dist/list.min',
    'fuzzySearch':      '/bower/list.fuzzysearch.js/dist/list.fuzzysearch.min',
    'selectize':        '/bower/selectize/dist/js/standalone/selectize.min',
    'browser-screen':   'browser-screen',
    'auth-login':       'auth-login',
    'google-analytics': 'google-analytics',
    'bookmarklet':      '/src/get-bookmarklet-url'
  }
});

require(['languages', 'jquery', 'selectize', 'browser-screen', 'auth-login', 'bookmarklet'],
  function (Languages, $) {
    'use strict';
    // Call this when language picker element is ready.
    Languages.ready({ position: 'bottom', arrow: 'top' }, true);
});
