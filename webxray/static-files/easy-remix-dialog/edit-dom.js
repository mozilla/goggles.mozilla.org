(function(jQuery) {
  "use strict";
  
  var $ = jQuery;

  var INLINE_EXTRA_PX = 4;
  
  jQuery.fn.extend({
    makeTextEditable: function makeTextEditable() {
      this.each(function() {
        var target = $(this);
        var isBlock = (target.css('display') == 'block');
        var linkedNode = target.data("linked-node");
        var widget;
        if (isBlock)
          widget = $('<textarea></textarea>');
        else
          widget = $('<input type="text"></input>');

        widget.val(target.text());

        function resize() {
          var placeholdingText = $('<div></div>');
          
          placeholdingText.css('display', target.css('display'));
          widget.parent().append(placeholdingText);
          placeholdingText.text(widget.val());
          
          if (isBlock)
            widget.css({
              width: placeholdingText.width(),
              height: placeholdingText.height()
            });
          else
            widget.width(placeholdingText.width() + INLINE_EXTRA_PX);

          placeholdingText.remove();
        }
        
        widget.keyup(function() {
          resize();
          if (linkedNode)
            linkedNode.nodeValue = widget.val();
        });

        target.empty().append(widget);
        resize();
      });

      return this;
    }
  });
})(jQuery);
