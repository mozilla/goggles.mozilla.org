(function() {
  require(['jquery'], function ($) {
    var csrf = document.getElementById("require-js").getAttribute("data-csrf");

    var joinEl = $('#webmaker-nav .join-button'),
        signinEl = $('#webmaker-nav .signin-button'),
        logoutEl = $('#webmaker-nav .logoutbutton'),
        hostname = $("#require-js").attr("data-hostname"),
        html = document.getElementsByTagName("html")[0],
        userElement = $( "div.user" ),
        placeHolder = $( "#identity" ),
        lang = html && html.lang ? html.lang : "en-US",
        webmakerNav = $("#webmaker-nav"),
        userfield = $("#identity");

    var auth = new WebmakerLogin({
      csrfToken: csrf,
      showCTA: false
    });

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

    function enable(user) {
      displayLogin(user);
      webmakerNav.addClass("loggedin");
      signinEl.addClass("hidden");
      joinEl.addClass("hidden");
      logoutEl.removeClass("hidden");
      $(".publish-disable-overlay").hide();
      $(".publish-enable-overlay").show();
    };

    function disable() {
      displayLogin();
      webmakerNav.removeClass("loggedin");
      signinEl.removeClass("hidden");
      joinEl.removeClass("hidden");
      logoutEl.addClass("hidden");
      $(".publish-enable-overlay").hide();
      $(".publish-disable-overlay").show();
    }

    joinEl.click(function() {
      auth.create();
    });
    signinEl.click(function() {
      auth.login();
    });
    logoutEl.click(function() {
      auth.logout();
    });

    auth.on('login', function(user) {
      enable(user);
    });

    auth.on('verified', function(user) {
      if ( !user ) {
        return disable();
      }
      enable(user);
    });

    auth.on('logout', function() {
      disable();
    });

    disable();
  });
}());
