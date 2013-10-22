/**
 * The X-Ray Goggles have moved to https://goggles.webmaker.org
 *
 * Please update your bookmarklet by visiting the new page and
 * dragging the bookmarklet code into your bookmark bar.
 */
(function() {
    var make = function(html) { var outer = document.createElement("div"); outer.innerHTML = html; return outer.childNodes[0]; };
    var underlay = make('<div class="underlay"></div>');
    var style = make('<style>.underlay { padding: 0; background: rgba(0,0,0,0.5); position: absolute; top: 0; bottom: 0; left: 0; right: 0; }' +
                            '.underlay .notice { padding: 0; background: white; position: absolute; top: 50%; left: 50%; width: 400px; margin-left: -200px; margin-top: -200px; font-family:  "Helvetica Neue",Helvetica,Arial,sans-serif; color: 4D4E53; }'+
                            '.underlay .notice h1 { font-size: 1.75em; vertical-align: top; line-height: 1.65em; font-weight: 600; color: #333; margin: 16px 16px 0; }'+
                            '.underlay .notice h1 img { display: inline; width: 50%; margin: 0; }'+
                            '.underlay .notice h2 { background-color: #FFCD36; border-bottom: 3px solid #3FB58E; margin: 0; height: 2em; font-size: 1em; text-align: center; line-height: 2em; }'+
                            '.underlay .notice p { color: #00293E; padding: 0 1em; font-family: Verdana; text-align: justify; }</style>');
    var notice = make('<div class="notice">'+
                       '<h1><img src="https://goggles.mofostaging.net/img/goggles-wordmark.png"></h1>'+
                       '<h2>The X-Ray Goggles have moved</h2>'+
                       "<p>We've updated the X-Ray Goggles, and we think you're going to love it!</p>"+
                       '<p>You can now save your remixes to your own personalized domain.</p>'+
                       '<p>To install the new bookmarklet, head over to <a target="_blank" href="https://goggles.webmaker.org">https://goggles.webmaker.org</a></p>'+
                       '</div>');
    notice.onclick = function() { document.body.removeChild(underlay); };
    underlay.appendChild(style);
    underlay.appendChild(notice);
    document.body.appendChild(underlay);
}());
