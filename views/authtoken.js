(function() {
  var tks = location.hash;

  if (tks) {
    tks = tks.split("#token=");
    if (tks[1]) {
      localStorage["goggles-auth-token"] = tks[1];
    } // else { localStorage.removeItem("goggles-auth-token"); }
  } // else { localStorage.removeItem("goggles-auth-token"); }

  if (window.location.toString().indexOf("logout=true") !== -1) {
    localStorage.removeItem("goggles-auth-token");
    var loginStatus = document.querySelector(".loginstatus")
    if (loginStatus) {
      loginStatus.textContent = "out";
    }
  }
}());
