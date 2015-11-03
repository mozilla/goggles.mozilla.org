(function() {
  var loc = window.location;
  var tks = loc.hash;

  if (tks) {
    tks = tks.split("#token=");
    console.log("token found:", loc.toString(), tks);
    if (tks[1]) {
      console.log("token:", tks[1]);
      localStorage.setItme("goggles-auth-token", tks[1]);
    } // else { localStorage.removeItem("goggles-auth-token"); }
  } // else { localStorage.removeItem("goggles-auth-token"); }

  if (loc.toString().indexOf("logout=true") !== -1) {
    console.log("logout requested:", loc.toString());
    localStorage.removeItem("goggles-auth-token");
    var loginStatus = document.querySelector(".loginstatus")
    if (loginStatus) {
      loginStatus.textContent = "out";
    }
  }
}());
