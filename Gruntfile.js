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
          "public/**/*.css"
        ]
      },
      recess: {
        dist: {
          options: {
            noOverQualifying: false,
            noIDs: false,
            strictPropertyOrder: false
          },
          src: [
            "public/**/*.less"
          ]
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
  grunt.loadNpmTasks("grunt-gettext-finder");

  grunt.registerTask( "default", [ "csslint", "jshint" ]);
  grunt.registerTask( "validate", [ "gettext_finder" ]);
};
