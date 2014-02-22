module.exports = function middlewareConstructor(env) {

  var metrics = require('./metrics')(env),
      utils = require("./utils"),
      hood = require("hood"),
      emulate_s3 = env.get('S3_EMULATION') || !env.get('S3_KEY'),
      knox = emulate_s3 ? require("noxmox").mox : require("knox");

  return {
    /**
     * Content Security Policy HTTP response header
     * helps you reduce XSS risks on modern browsers
     * by declaring what dynamic resources are allowed
     * to load via a HTTP Header.
     */
    addCSP: function ( options ) {
      return hood.csp({
        headers: [
          "Content-Security-Policy-Report-Only"
        ],
        policy: {
          'connect-src': [
            "'self'"
          ],
          'default-src': [
            "'self'"
          ],
          'frame-src': [
            "'self'",
            options.personaHost
          ],
          'font-src': [
            "'self'",
            "https://mozorg.cdn.mozilla.net"
          ],
          'img-src': [
            "*"
          ],
          'media-src': [
            "*"
          ],
          'script-src': [
            "'self'",
            "http://mozorg.cdn.mozilla.net",
            "https://mozorg.cdn.mozilla.net",
            "https://ssl.google-analytics.com",
            options.personaHost

          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            "http://mozorg.cdn.mozilla.net",
            "https://fonts.googleapis.com",
            "https://mozorg.cdn.mozilla.net",
          ]
        }
      });
    },

    /**
     * The operation for the / route is special,
     * and never an edit or remix.
     */
    setNewPageOperation: function(req, res, next) {
      req.body.pageOperation = "create";
      next();
    },

    /**
     * By default, the publish operation is to create a new
     * page. Later functions can override this behaviour.
     */
    setDefaultPublishOperation: function(req, res, next) {
      req.body.pageOperation = "remix";
      next();
    },

    /**
     * Override the default publication operation to act
     * as an update, rather than a create. This will lead
     * to old data being overwritten upon publication.
     */
    setPublishAsUpdate: function(req, res, next) {
      req.body.pageOperation = "edit";
      next();
    },

    /**
     * Check whether the requesting user is authenticated through Persona.
     */
    checkForAuth: function(req, res, next) {
      var err = undefined;
      if (!req.session.email) {
        err = new Error("No persona session was found, please log in first.");
      }
      else if (!req.session.user.username) {
        err = new Error("No username was found for " + req.session.persona + ".");
      }
      next(err);
    },

    /**
     * Check to see whether a page request is actually for some page.
     */
    requestForId: function(req, res, next) {
      if(!req.params.id) {
        return next(new Error("request did not point to a project"));
      }
      next();
    },

    /**
     * Check to see if a publish attempt actually has data for publishing.
     */
    checkForPublishData: function(req, res, next) {
      if(!req.body.html || req.body.html.trim() === "") {
        return next(new Error("no data to publish"));
      }
      req.body.titleFragment = req.session.user.username + "'s remix of";
      req.body.html = req.body.html.replace(">{{username}}'s' remix of", ">" + req.body.titleFragment);
      next();
    },

    /**
     * Ensure a publish has metadata. If not default it to an empty object.
     */
    ensureMetaData: function(req, res, next) {
      if(!req.body.metaData) {
        req.body.metaData = {};
      }
      var title = req.body.html.match(/title[^>]*>([^<]*)<\/title/)[1];
      req.body.metaData.title = title;
      req.body.metaData.description = title.replace(req.body.titleFragment, "An X-Ray Goggles remix of");
      req.body.metaData.author = req.session.user.username;
      // where should the following value come from?
      req.body.metaData.locale = "";
      next();
    },

    /**
     * Sanitize metadata so that there's no raw HTML in it
     */
    sanitizeMetaData: function(req, res, next) {
      var escapeHTML = function(content) {
            return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          },
          metaData = req.body.metaData,
          prop;
      for(prop in metaData) {
        if(metaData.hasOwnProperty(prop)) {
          metaData[prop] = escapeHTML(metaData[prop]);
        }
      }
      next();
    },

    /**
     * Ensure we're safe to do an edit, if not, force a remix.
     */
    checkPageOperation: function(db) {
      return function(req, res, next) {
        var originalId = req.body.origin;
        // Ensure we are doing an edit on an existing project.
        if (!originalId) {
          return next();
        }

        // Verify that the currently logged in user owns
        // this page, otherwise they might try to update
        // a non-existent page when they hit "publish".
        db.find(originalId, function(err, result) {
          if(err) {
            return next(err);
          }

          // We own this page, so an edit is safe.
          if (req.body.pageOperation === "edit" && result.userid === req.session.email) {
            // We need to know if an edit changed the title,
            // so we can update the old project by the old url.
            if (req.body.metaData.title !== result.title) {
              req.oldUrl = result.url;
            }
            return next();
          }

          // Otherwise, we don't own this page. Go to a remix instead.
          req.body.remixedFrom = result.url;
          req.body.pageOperation = "remix";
          next();
        });
      };
    },

    /**
     * Publish a page to the database. If it's a publish by
     * the owning user, update. Otherwise, insert.
     */
    saveData: function(db, hostName) {
      return function(req, res, next) {
        if (req.body.metaData.title) {
          req.pageTitle = utils.slugify(req.body.metaData.title);
        } else {
          req.pageTitle = "";
        }

        var options = {
          edit: (req.body.pageOperation === "edit"),
          origin: req.body.origin,
          remixedFrom: req.body.remixedFrom,
          rawData: req.body.html,
          sanitizedData: req.body.sanitizedHTML,
          title: req.pageTitle,
          userid: req.session.email
        };

        db.write(options, function(err, result) {
          if (err) {
            metrics.increment('project.save.error');
          } else {
            req.publishId = result.id;
            metrics.increment('project.save.success');
          }
          next(err);
        });
      };
    },

    /**
     * Update the database to store the URL created from S3
     */
    saveUrl: function(db) {
      return function(req, res, next) {
        var options = {
          id: req.publishId,
          userid: req.session.email,
          url: req.publishedUrl
        };
        db.updateUrl(options, function(err, project) {
          if (err) {
            return next(err);
          }
          req.project = project;
          next();
        });
      };
    },

    /**
     * Find the make id of the project this was remixed from
     */
    getRemixedFrom: function(db, make) {
      return function(req, res, next) {
        db.find(req.publishId, function(err, result) {
          if (err) {
            return next(err);
          }
          // This means we don't have a remix to worry about
          if (!result.remixedFrom) {
            return next();
          }
          make.search({url: result.remixedFrom}, function(err, makes) {
            if (err) {
              return next(err);
            }
            if (makes.length === 1) {
              req.body.remixedFrom = makes[0]._id;
            }
            next();
          });
        });
      };
    },

    rewritePublishId: function(db) {
      return function(req, res, next) {
        // If the user hasn't defined a title, just use the publishId as-is
        if (!req.pageTitle) {
          req.pageTitle = req.publishId;
          return next();
        }

        // is this an edit or supposed to be a new page?
        var edit = (req.body.pageOperation === "edit");

        db.count({
          userid: req.session.email,
          title: req.pageTitle
        }, function(err, count) {
          if (err) {
            return next(err);
          }

          if (!edit && count > 1) {
            // when it comes to xray goggles publications, multple
            // same-titled makes are fine. We just need to make sure
            // the URL has the count attached.
            req.pageTitleCount = count;
          }

          next();
        });
      };
    },

    generateUrls: function(appName, s3Url, domain) {
      var url = require("url"),
          s3 = knox.createClient(s3Url);

      return function(req, res, next) {
        var subdomain = req.session.user.username,
            suffix = (req.pageTitleCount ? "-" + req.pageTitleCount : ""),
            path = "/" + appName + "/" + req.pageTitle + suffix;

        // Title count suffix, if the title is not unique
        req.publishLocation = "/" + subdomain + path;
        req.s3Url = s3.url(req.publishLocation);

        // Used for make API if USER_SUBDOMAIN exists
        if (domain) {
          domain = url.parse(domain);
          req.customUrl = domain.protocol + "//" + subdomain + "." + domain.host + path;
        }

        next();
      };
    },

    finalizeProject: function(nunjucksEnv, env) {
      var hostname = env.get("HOSTNAME");
      return function(req, res, next) {
        var projectURL = hostname + "/project/" + req.publishId;
        req.body.projectURL = projectURL;
        req.body.finalizedHTML = req.body.sanitizedHTML;
        next();
      };
    },

    /**
     * Publish a page to S3. If it's a publish by
     * the owning user, this effects an update. Otherwise,
     * this will create a new S3 object (=page).
     */
    publishData: function(options) {
      // NOTE: workaround until https://github.com/LearnBoost/knox/issues/194 is addressed.
      //       this line prevents knox from forming url-validation-failing S3 URLs.
      if(!options.port) { delete options.port; }

      var s3 = knox.createClient(options);

      return function(req, res, next) {
        var userId = req.session.user.username,
            data = req.body.finalizedHTML,
            headers = {
              'x-amz-acl': 'public-read',
              'Content-Length': Buffer.byteLength(data,'utf8'),
              'Content-Type': 'text/html;charset=UTF-8'
            };

        var location = req.publishLocation,
            s3PublishError = new Error("There was a problem publishing the page. Your page has been saved"+
                                       " with id "+req.publishId+", so you can edit it, but it could not be"+
                                       " published to the web."),
            s3Error = new Error("failure during publish step (error "+res.statusCode+")");


        // write data to S3
        s3.put(location, headers)
          .on("error", function(err) {
            next(s3PublishError);
          })
          .on("response", function(res) {
            if (res.statusCode === 200) {
              req.publishedUrl = s3.url(location);
              metrics.increment('project.publish.success');
              next();
            } else {
              metrics.increment('project.publish.error');
              next(s3Error);
            }
          })
        .end(data);
      };
    },
    /**
     * Turn the S3 URL into a user subdomain
     */
    rewriteUrl: function(req, res, next) {
      if (req.customUrl) {
        req.publishedUrl = req.customUrl;
      }
      next();
    },

    /**
     * Publish a page to the makeAPI. If it's "our" page,
     * update, otherwise, create.
     */
    publishMake: function(make) {
      return function(req, res, next) {
        var metaData = req.body.metaData,
            project = req.project,
            options = {
              thumbnail: metaData.thumbnail,
              contentType: "application/x-x-ray-goggles",
              // metadata
              title: metaData.title || "",
              description: metaData.description || "",
              author: metaData.author || "",
              locale: metaData.locale || req.localeInfo.locale || "en_US",
              email: req.session.email,
              url: req.publishedUrl,
              contenturl: req.publishedUrl,
              remixedFrom: req.body.remixedFrom,
              // There is no remixing involved here, you just fire up the goggles again.
              remixUrl: req.publishedUrl,
              tags: metaData.tags ? metaData.tags.split(",") : []
            };

        function finalizePublishMake(err) {
          if (err) {
            metrics.increment('makeapi.publish.error');
            return next(err);
          }

          metrics.increment('makeapi.publish.success');
          next();
        }

        if (project.makeid) {
          make.update(project.makeid, options, finalizePublishMake);
        } else {

          make.search({
            email: req.session.email,
            url: req.oldUrl || req.publishedUrl
          }, function(err, results) {
            if (err) {
              return finalizePublishMake(err);
            }

            var result = results[0];

            if (result) {
              project.updateAttributes({ makeid: result.id })
              .error(function(err) {
                return next(err);
              })
              .success(function(updatedProject) {
                req.project = updatedProject;
                make.update(updatedProject.makeid, options, finalizePublishMake);
              });
            } else {
              make.create(options, function( err, make ) {
                if (err) {
                  return finalizePublishMake(err);
                }

                project.updateAttributes({ makeid: make.id })
                .error(function(err) {
                  return next(err);
                })
                .success(function(updatedProject) {
                  req.project = updatedProject;
                  finalizePublishMake( err, make );
                });
              });
            }
          });
        }
      };
    },

    /**
     * Unpublish (delete/remove) a project.
     */
    deleteProject: function(databaseAPI) {
      return function(req, res, next) {
        databaseAPI.destroy(req.requestId, function(err, project) {
          if(err) {
            next(err);
          }
          res.json({"status": 200});
        });
      };
    }
  };
};
