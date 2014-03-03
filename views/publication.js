/**
 *
 */
function DeferredTimeout(ms) {
  var deferred = jQuery.Deferred();

  setTimeout(function() { deferred.resolve(); }, ms);
  return deferred;
}

/**
 *
 */
function DeferredPublish(html, originalURL, hackpubURL) {
  return jQuery.ajax({
    type: 'POST',
    url: hackpubURL + "publish",
    data: {
      'html': html,
      'original-url': originalURL
    },
    headers: {
      'X-CSRF-Token': $("meta[name='csrf-token']").attr("content")
    },
    crossDomain: true,
    dataType: 'json'
  });
}

/**
 *
 */
function setupUI(html, originalURL, hackpubURL) {
  $(".to-internet.big-button").click(function() {
    $("#choose-publish-method").fadeOut(function() {
      $("#to-internet").fadeIn(function() {
        var timeout = DeferredTimeout(1000);
        var publish = DeferredPublish(html, originalURL, hackpubURL);
        jQuery.when(publish, timeout).then(
          function onSuccess(publishArgs) {
            $("#to-internet .loading").fadeOut(function() {
              var data = publishArgs[0];
              var url = data['published-url'];
              $(".published-url a").attr("href", url).text(url);
              $("#to-internet .finished").fadeIn();
            });
          },
          function onFailure() {
            $("#to-internet .loading").fadeOut(function(){
              $("#to-internet .failure").fadeIn();
            });
          }
        );
      });
    });
  });
  $(".view-html.big-button").click(function() {
    $("#choose-publish-method").fadeOut(function() {
      $("#view-html textarea").val(html).focus().select();
      $("#view-html").fadeIn();
    });
  });
}

/**
 *
 */
function init(html, originalURL, hackpubURL) {
  var ppxURL = "http://toolness.github.com/postmessage-proxied-xhr/";

  yepnope({
    test: jQuery.support.cors,
    nope: [ppxURL + 'ppx.min.js', ppxURL + 'ppx.jquery.min.js'],
    complete: function() {
      if (!jQuery.support.cors)
        jQuery.proxyAjaxThroughPostMessage(hackpubURL + 'ppx-server');
      setupUI(html, originalURL, hackpubURL);
    }
  });

  var html = document.querySelector("html");
      userElement = $("div.user"),
      placeHolder = $("#identity"),
      lang = html && html.lang ? html.lang : "en-US",
      loginButtonSpan = $("#webmaker-nav .loginbutton"),
      logoutButtonSpan = $("#webmaker-nav .logoutbutton");

  function displayLogin(userData) {
    if (userData) {
      placeHolder.html('<a href="{{ hostname }}/' + lang + '/account">' + userData.displayName + "</a>");
      placeHolder.before("<img src='https://secure.gravatar.com/avatar/" +
                          userData.emailHash + "?s=26&d=https%3A%2F%2Fstuff.webmaker.org%2Favatars%2Fwebmaker-avatar-44x44.png'" +
                          " alt=''>");
      userElement.show();
    } else {
      placeHolder.text("");
      userElement.hide();
    }
  }

  function enable(user) {
    displayLogin(user);
    html.classList.add("loggedin");
    loginButtonSpan.addClass("hidden");
    logoutButtonSpan.removeClass("hidden");
    $(".publish-disable-overlay").hide();
    $(".publish-enable-overlay").show();
    $("#identity > a").attr('target', "_blank");
  };

  function disable() {
    displayLogin();
    html.classList.remove("loggedin");
    loginButtonSpan.removeClass("hidden");
    logoutButtonSpan.addClass("hidden");
    $(".publish-enable-overlay").hide();
    $(".publish-disable-overlay").show();
  }

  // Attach event listeners!
  gogglesAuth.on('login', function(userData, debuggingInfo) {
    user =  {
      data: userData.email,
      name: userData.displayName
    }
    enable(userData);
  });

  gogglesAuth.on('logout', function() {
    user = false;
    disable(user);
  });

  gogglesAuth.verify();
}

/**
 * run immediately
 */
(function(){
  window.addEventListener("message", function(event) {
    $("#close").click(function() {
      window.parent.postMessage("close", "*");
    });
    var data = JSON.parse(event.data);
    // only run this is it's really a hackpub message. Otherwise, don't trigger.
    if(data.html && data.originalURL && data.hackpubURL) {
      init(data.html, data.originalURL, data.hackpubURL);
    }
  }, false);
}());
