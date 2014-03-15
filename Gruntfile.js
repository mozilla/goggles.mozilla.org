module.exports = function( grunt ) {
  grunt.initConfig({
    pkg: grunt.file.readJSON( "package.json" ),

    csslint: {
      lax: {
        options: {
          "adjoining-classes": false,
          "box-model": false,
          "box-sizing": false,
          "bulletproof-font-face": false,
          "compatible-vendor-prefixes": false,
          "ids": false,
          "important": false,
          "outline-none": false,
          "overqualified-elements": false,
          "qualified-headings": false,
          "regex-selectors": false,
          "star-property-hack": false,
          "underscore-property-hack": false,
          "universal-selector": false,
          "unique-headings": false,
          "unqualified-attributes": false,
          "vendor-prefix": false,
          "zero-units": false
        },
        src: [
          "public/stylesheets/*.css","!public/bower/**/*","!public/webxray.css"
        ]
      }
    },
    lesslint: {
      src: ["public/stylesheets/style.less"],
        options: {
          csslint: {
            "adjoining-classes": false,
            "box-model": false,
            "box-sizing": false,
            "bulletproof-font-face": false,
            "compatible-vendor-prefixes": false,
            "duplicate-background-images": false,
            "ids": false,
            "important": false,
            "outline-none": false,
            "overqualified-elements": false,
            "qualified-headings": false,
            "regex-selectors": false,
            "star-property-hack": false,
            "underscore-property-hack": false,
            "universal-selector": false,
            "unique-headings": false,
            "unqualified-attributes": false,
            "vendor-prefix": false,
            "zero-units": false
          }
        }
    },
    jshint: {
      files: [
        "Gruntfile.js",
        "app.js",
        "lib/**/*.js"
     ]
    },
    gettext_finder: {
      files: ["views/*.html", "views/**/*.html"],
      options: {
        pathToJSON: ["locale/en_US/goggles.webmaker.org.json"],
        ignoreKeys: grunt.file.readJSON("gtf-ignored-keys.json")
      }
    }
  });

  grunt.loadNpmTasks( "grunt-contrib-csslint" );
  grunt.loadNpmTasks( "grunt-contrib-jshint" );
  grunt.loadNpmTasks( "grunt-gettext-finder" );
  grunt.loadNpmTasks( "grunt-lesslint" );

  grunt.registerTask( "default", [ "csslint", "jshint", "lesslint" ]);
  grunt.registerTask( "validate", [ "gettext_finder" ]);
};
