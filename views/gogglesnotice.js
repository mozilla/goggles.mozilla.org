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
  link.style.color = "#1BA9E0";
  link.style.textDecoration = "none";

  var notice = document.createElement("div");
  notice.innerHTML = "This is a <a href='{{hostname}}'>Mozilla X-Ray Goggles</a> remix of ";
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
    "background: #6A6DB1",
    "text-align: center"
  ].join("; "));

  var a = notice.querySelector("a");
  link.style.color = "rgb(23, 151, 221)";
  link.style.textDecoration = "none";

  document.body.appendChild(notice);
}());
