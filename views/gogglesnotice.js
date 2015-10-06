(function(doc) {
  var meta = doc.querySelector("meta[name='data-remix-host']");
  var url = meta.getAttribute("content");
  var link = document.createElement("a");
  link.href = url;
  link.textContent = url;

  var notice = document.createElement("div");
  notice.textContent = "This is a Mozilla X-Ray Goggles remix of ";
  notice.appendChild(link);

  notice.setAttribute("style", [
    "display: block !important",
    "position: fixed !important",
    "z-index: 2147483647 !important",
    "top: 0",
    "left: 0",
    "right: 0",
    "height: 2em",
    "line-height: 2em",
    "color: white",
    "background: black",
    "opacity: 0.5",
    "text-align: center"
  ].join("; "));

  doc.body.appendChild(notice);
}(window.document));
