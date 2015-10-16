(function() {
  var tks = location.hash;
  if (tks) {
    tks = tks.split("#token=");
    if (tks[1]) {
      localStorage["goggles-auth-token"] = tks[1];
    } else { localStorage.removeItem("goggles-auth-token"); }
  } else { localStorage.removeItem("goggles-auth-token"); }

  if (window.location.toString().indexOf("logout=true") !== -1) {
    document.querySelector(".loginstatus").textContent = "out";
  }
}());
