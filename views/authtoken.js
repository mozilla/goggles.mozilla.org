(function() {
  var loc = window.location;
  var tks = loc.hash;

  if (tks) {
    tks = tks.split("#token=");
    if (tks[1]) {
      localStorage["goggles-auth-token"] = tks[1];
    }
  }

  if (loc.toString().indexOf("logout=true") !== -1) {
    localStorage.removeItem("goggles-auth-token");
    var loginStatus = document.querySelector(".loginstatus")
    if (loginStatus) {
      loginStatus.textContent = "out";
    }
  }
}());
