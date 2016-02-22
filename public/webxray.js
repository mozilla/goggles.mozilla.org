(function recommendGogglesUpdate() {
  var setStyle = function(e, s) {
    Object.keys(s).forEach(function(k) {
      e.style[k] = s[k];
    });
  };

  var overlay = document.createElement("div");
  overlay.id = "goggles-notice-element";
  setStyle(overlay, {
    fontFamily: "Verdana, Arial, sans-serif",
    position: "fixed",
    background: "rgba(0,0,0,0.3)",
    top:0,
    bottom:0,
    left:0,
    right:0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9001
  });

  var notice = document.createElement("div");
  setStyle(notice, {
    maxWidth: "37em",
    background: "#6a6db1"
  });
  overlay.appendChild(notice);

  var style = document.createElement("style");
  style.textContent = [
    "#goggles-notice-element p {",
    "  margin: 10px;",
    "  padding: 0.25em 0.5em;",
    "}",
  ].join('\n');

  var heading = document.createElement("h2");
  setStyle(heading, {
    fontSize: "120%",
    whiteSpace: "nowrap",
    margin: 0,
    padding: "0.5em",
    textAlign: "center",
    background: "#4b51aa",
    color: "white"
  });
  heading.textContent ="The X-Ray Goggles bookmark has moved!";
  notice.appendChild(heading);

  var text = document.createElement("p");
  setStyle(text, {
    margin: "10px",
    padding: "0.25em 0.5em",
    color: "white"
  });
  text.innerHTML = "<p>X-Ray Goggles has a new home at <a href='https://goggles.mozilla.org'>https://goggles.mozilla.org</a>!<p>Head on over and follow the instructions to get the new bookmarklet. While you're there, have a look at the new sample activity. How many animals can you make?";
  notice.appendChild(text);

  var a = text.querySelector("a");
  setStyle(a, {
    color: "#DDD"
  });
  a.target = "_blank"; 

  overlay.onclick = function() { document.body.removeChild(overlay); };

  document.body.appendChild(overlay);
}());
