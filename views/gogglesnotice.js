(function() {
  var unknown = "an unknown webpage";

  var meta = document.querySelector("script[data-original-url]");
  if(!meta) {
    console.error("could not find the element that houses the original URL for this remix");
    meta = {
      getAttribute: function() {
        return unknown;
      }
    }
  }

  var url = meta.getAttribute("data-original-url");
  var link = document.createElement("a");
  if (url !== unknown) {
    link.href = url;
  }
  link.textContent = url;
  link.setAttribute("style", "color:white!important;text-decoration:underline!important;");

  var usesHTTP = (window.location.toString().indexOf("http://") > -1);

  var notice = document.createElement("div");
  notice.innerHTML = "This is a <a style='color:white!important;text-decoration:underline!important;' href='{{hostname}}'>Mozilla X-Ray Goggles</a> remix of ";
  notice.appendChild(link);

  // give the user a corresponding https:// link if they're on http://
  if (usesHTTP) {
    var span = document.createElement("span");
    span.innerHTML = " - To see this same page hosted on HTTPS, click ";
    link = document.createElement("a");
    link.href = window.location.toString().replace("http://","https://");
    link.textContent = "here";
    link.setAttribute("style", "color:white!important;text-decoration:underline!important;");
    notice.appendChild(span);
    notice.appendChild(link);
  }

  var closer = document.createElement("div");
  closer.setAttribute("style", [
    "position: absolute",
    "bottom: 3px",
    "right: 3px",
    "height: 1em",
    "width: 1em",
    "border-radius: 100%",
    "background: rgba(0,0,0,0.4)",
    "color: grey",
    "font-family: Verdana",
    "font-size: 1.5em",
    "padding: 0",
    "line-height: 0.75",
    "overflow: hidden",
    "cursor: pointer"
  ].join("; "));
  closer.textContent="x";
  notice.appendChild(closer);
  closer.onclick = function() {
    notice.parentNode.removeChild(notice);
  };

  notice.setAttribute("style", [
    "display: block !important",
    "position: fixed !important",
    "z-index: 2147483647 !important",
    "top: 0",
    "left: 0",
    "right: 0",
    "line-height: 2em",
    "color: white",
    "background: rgb(59, 64, 171)",
    "text-align: center"
  ].join("; "));

  document.body.appendChild(notice);
}());
