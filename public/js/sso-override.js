(function() {
  require(['jquery', 'auth-login'], function ($) {
    var hostname = document.getElementById("require-js").getAttribute("data-hostname");

    var html = document.getElementsByTagName("html")[0],
        userElement = $( "div.user" ),
        placeHolder = $( "#identity" ),
        lang = html && html.lang ? html.lang : "en-US",
        loginButtonSpan = $("#webmaker-nav .loginbutton"),
        logoutButtonSpan = $("#webmaker-nav .logoutbutton"),
        webmakerNav = $("#webmaker-nav");

    function displayLogin(userData) {

      if (userData) {
        placeHolder.html('<a href="' + hostname + '/' + lang + '/account">' + userData.username + "</a>");
        placeHolder.parent().children('img').attr('src', userData.avatar);
        userElement.show();
      } else {
        placeHolder.text("");
        userElement.hide();
      }
    }

    var userfield = $("#identity");

    function enable(user) {
      displayLogin(user);
      webmakerNav.addClass("loggedin");
      loginButtonSpan.addClass("hidden");
      logoutButtonSpan.removeClass("hidden");
    };

    function disable() {
      displayLogin();
      webmakerNav.removeClass("loggedin");
      loginButtonSpan.removeClass("hidden");
      logoutButtonSpan.addClass("hidden");
    }

    // Attach event listeners!
    gogglesAuth.on('login', function(user, debuggingInfo) {
      enable(user);
    });

    gogglesAuth.on('logout', function() {
      disable();
    });

    disable();
    gogglesAuth.verify();
  });
}());
