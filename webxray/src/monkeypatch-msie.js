(function(jQuery) {
  if (typeof(Array.prototype.indexOf) == "undefined")
    Array.prototype.indexOf = function(value) {
      return jQuery.inArray(value, this);
    };
    
  if (typeof(Array.prototype.map) == "undefined")
    Array.prototype.map = function(callback) {
      return jQuery.map(this, callback);
    };
    
  if (typeof(Array.prototype.forEach) == "undefined")
    Array.prototype.forEach = function(callback) {
      jQuery.each(this, function() {
        callback(this);
      });
    };
})(jQuery);
