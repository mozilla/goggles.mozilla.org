module.exports = function middlewareConstructor(env) {

  return {
    /**
     * Publish a page to the database. If it's a publish by
     * the owning user, update. Otherwise, insert.
     */
    saveData: function(db, hostName) {
      return function(req, res, next) {
        var options = {
          origin: req.body.origin,
          remixedFrom: req.body.remixedFrom || "unknown",
          data: req.body.html,
          userid: req.session.email
        };

  console.log("let's do this:", options);

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
  }
};
