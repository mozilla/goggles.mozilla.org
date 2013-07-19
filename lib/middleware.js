module.exports = function middlewareConstructor(env) {

  return {

    /**
     * Publish a page to the database. If it's a publish by
     * the owning user, update. Otherwise, insert.
     */
    saveData: function(db, hostName) {
      return function(req, res, next) {

        var options = {
          edit: (req.body.pageOperation === "edit"),
          origin: req.body.origin,
          remixedFrom: "unknown",
          rawData: req.body.html,
          sanitizedData: req.body.sanitizedHTML,
          title: req.pageTitle,
          userid: req.session.email
        };

        db.write(options, function(err, result) {
          if (err) {
            console.log('project.save.error');
            console.log(err);
          } else {
            req.publishId = result.id;
            console.log('project.save.success');
          }
          next(err);
        });
      };
    }

  };
};
