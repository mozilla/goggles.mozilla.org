(function (jQuery) {
  var $ = jQuery;
  
  jQuery.HtmlEditor = function (idToEdit, textContent, onChange) {
    var editor = CodeMirror(function(element) {
      $("#" + idToEdit).replaceWith(element);
    }, {
      mode: "text/html",
      theme: "jsbin",
      tabMode: "indent",
      value: textContent,
      lineWrapping: true,
      onChange: function() {
        onChange(editor.getValue());
      }
    });

    onChange(editor.getValue());
  }
})(jQuery);
