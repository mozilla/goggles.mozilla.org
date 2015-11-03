/**
 * Immediately invoked runner function
 */
(function() {

  var idwmo = "{{ idwmoURL }}";
  var publishwmo = "{{ publishwmoURL }}";

  var gogglesFile        = "/index.html";
  var gogglesClientId    = "{{ clientId }}";
  var gogglesClientIdLib = "{{ clientIdLib }}";
  var gogglesDataLabel   = "goggles-publish-data";
  var gogglesAuthLabel   = "goggles-auth-token";


  function logoutUrl(id) {
    return idwmo + "/logout?client_id=" + id;
  }

  function loginUrl(id) {
    return idwmo + "/login/oauth/authorize?" + [
                    "client_id=" + id,
                    "response_type=token",
                    "scopes=user email",
                    "state=goggles"
                  ].join("&");
  }

  function signupUrl(id) {
    return loginUrl(id) + "&action=signup";
  }

  var checked = false;
  var userdata = false;
  var boundary = 'G0ggl3s';

  var loggedOutTemplate = document.querySelector("script[type='text/html'].loggedout").textContent;
  var loggedInTemplate = document.querySelector("script[type='text/html'].loggedin").textContent;
  var publishedTemplate = document.querySelector("script[type='text/html'].publish").textContent;

  /**
   * [openInNew description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  function openInNew(url) {
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.setAttribute("style", "position:absolute; display:block; width:0; height:0; color: transparent; background: transparent");
    // Firefox requires an element is in the DOM before it allows a click.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * [checkForUser description]
   * @return {[type]} [description]
   */
  function checkForUser() {
    if (!checked) {
      checked = true;
      var authToken = localStorage[gogglesAuthLabel];
      if (!!authToken) {
        publishAPI.checkUser(authToken);
        return true;
      }
    }
    return false;
  }

  /**
   * [showLoggedInHTML description]
   * @return {[type]} [description]
   */
  function showLoggedInHTML() {
    var container = document.querySelector("span.status.placeholder");
    container.innerHTML = loggedInTemplate;
    container.querySelector("img").src = userdata.avatar;

    var usernameFields = Array.prototype.slice.call(container.querySelectorAll(".username"));
    usernameFields.forEach(function(field) {
      field.textContent = userdata.username;
    });

    // webxray library and landing page
    var logoutregion = container.querySelector(".logout.region");
    if(logoutregion) {
      var link = (logoutregion.nodeName === "A");
      if (link) {
        logoutregion.href = logoutUrl(gogglesClientId);
      }
      logoutregion.addEventListener("click", function(evt) {
        logout(link, link ? logoutregion : false, evt);
      });
    }
    listenForPublish();

    // landing page only
    var dropdown = container.querySelector(".dropdown");
    var icon = container.querySelector("#navbar-logged-in");
    if (dropdown && icon) {
      icon.addEventListener("click", function() {
        dropdown.classList.toggle("hidden");
      });
    }
  }

  /**
   * [showPublishResult description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  function showPublishResult(url) {
    var container = document.querySelector("span.status.placeholder");
    container.innerHTML = publishedTemplate;
    var a = container.querySelector("a.publication");
    a.href = url;
    a.textContent = url;

    var button = container.querySelector("button.review.button");
    if (button) {
      button.addEventListener("click", function() {
        openInNew(url);
      });
    }
  }

  /**
   * [triggerLogin description]
   * @return {[type]} [description]
   */
  function triggerLogin(link, signup) {
    return function() {
      checked = false;
      if (!link) {
        var id = gogglesClientIdLib;
        openInNew(signup ? signupUrl(id) : loginUrl(id));
      }
    };
  }

  function showLoggedOutHTML() {
    var container = document.querySelector("span.status.placeholder");
    container.innerHTML = loggedOutTemplate;
    return container;
  }

  /**
   * [logout description]
   * @return {[type]} [description]
   */
  function logout(bypass, link, evt) {
    checked = false;
    userdata = false;
    localStorage.removeItem(gogglesAuthLabel);

    var container = showLoggedOutHTML();
    var loginOption = container.querySelector("button.login, a.login-link");

    var link = (loginOption.nodeName === "A");
    if (link) {
      loginOption.href = loginUrl(gogglesClientId);
    }
    loginOption.addEventListener("click", triggerLogin(!!link));

    var signupOption = container.querySelector("button.signup, a.signup-link");
    link = (signupOption.nodeName === "A");
    if (link) {
      signupOption.href = signupUrl(gogglesClientId);
    }
    signupOption.addEventListener("click", triggerLogin(!!link, true));

    if (!bypass) {
      openInNew(logoutUrl(gogglesClientIdLib));
    }

  }

  /**
   * [constructMultipartPayload description]
   * @param  {[type]} fields [description]
   * @param  {[type]} data   [description]
   * @return {[type]}        [description]
   */
  function constructMultipartPayload(fields, data) {
    var payload = '';

    fields.forEach(function(field) {
      payload += '--' + boundary + '\r\n';
      payload += 'content-disposition: form-data; name="' + field.name + '"\r\n';
      payload += '\r\n' + field.content + '\r\n';
    });

    if (!data) {
      payload += '--' + boundary + '--\r\n';
      return payload;
    }

    payload += '--' + boundary + '\r\n';
    payload += 'content-disposition: form-data; name="buffer"; ';
    payload += 'filename="' + data.filename + '"\r\n';
    payload += 'Content-Type: ' + data.contentType + '\r\n';
    payload += '\r\n' + data.content + '\r\r\n';
    payload += '--' + boundary + '--\r\n';

    return payload;
  }

  /**
   * [publishAPI description]
   * @type {Object}
   */
  var publishAPI = {
    checkUser: function(authToken) {
      var checkUser = new XMLHttpRequest();
      checkUser.open("GET", idwmo + "/user", true);
      checkUser.setRequestHeader("authorization", "token " + authToken);
      checkUser.onload = function(evt) {
        userdata = false;
        try {
          userdata = JSON.parse(checkUser.response);
        } catch (e) {
          logout(true);
          console.error("Error parsing XHR responsein publishAPI.checkUser", checkUser.response, e);
        }
        if (userdata) {
          showLoggedInHTML();
          setTimeout(function getUserId() { publishAPI.login(authToken); },1);
        } else {
          userdata = {};
        }
      };
      checkUser.send(null);
    },

    login: function(authToken) {
      var login = new XMLHttpRequest();
      login.open("POST", publishwmo + "/users/login", true);
      login.setRequestHeader("Authorization", "token " + authToken);
      login.setRequestHeader("Content-Type", "application/json");
      login.onload = function(evt) {
        var data = false;
        try {
          data = JSON.parse(login.response);
        } catch (e) {
          console.error("Error parsing XHR response in publishAPI.login", login.response, e);
        }
        if (data) {
          userdata.id = data.id;
        }
      };
      login.send(JSON.stringify({ "name": userdata.username }));
    },

    publish: function(authToken) {
      if (!publishAPI.publishing) {
        this.publishing = true;
        publishAPI.createProject(authToken);
      }
    },

    createProject: function(authToken) {
      var newProject = new XMLHttpRequest();
      newProject.open("POST", publishwmo + "/projects", true);
      newProject.setRequestHeader("Authorization", "token " + authToken);
      newProject.setRequestHeader("Content-Type", "application/json");
      newProject.onload = function(evt) {
        var data = false;
        try {
          data = JSON.parse(newProject.response);
        } catch (e) {
          console.error("Error parsing XHR response in publishAPI.createProject", newProject.response, e);
        }
        if (data && data.id) {
          publishAPI.createIndexFile(authToken, data.id);
        }
      };

      newProject.send(JSON.stringify({
        "title": "My Goggles Remix",
        "user_id": userdata.id,
        "date_created": "" + Date.now(),
        "date_updated": "" + Date.now(),
        "description": "A Mozilla X-Ray Goggles remix of " + window.location.toString(),
        "readonly": true,
        "client": "X-Ray Goggles"
      }));
    },

    createIndexFile: function(authToken, project_id) {
      var saveFile = new XMLHttpRequest();
      saveFile.open("POST", publishwmo + "/files", true);
      saveFile.setRequestHeader("Authorization", "token " + authToken);
      saveFile.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

      saveFile.onload = function(evt) {
        publishAPI.publishProject(authToken, project_id);
      };

      var stored = localStorage[gogglesDataLabel];
      if (!stored) {
        return console.error("No publishable data was found in localStorage");
      }

      var data = false;
      try { data = JSON.parse(stored); }
      catch (e) { return console.error("Error parsing stored data", stored, e); }

      var html = data.html;

      // Rewrite the title to "...'s remix of ..."
      html = html.replace(/<title([^>]*)>/, "<title$1>" + userdata.username + "'s remix of ");

      // Inject the goggles notification, script controlled
      html = html.replace("</body", "<script data-original-url='" + data.url + "' src='{{ hostname }}/gogglesnotice.js'></script></body");

      var payload = constructMultipartPayload([{
        "name": "path",
        "content": gogglesFile
      },{
        "name": "project_id",
        "content": project_id
      }], {
        "name": "goggles remix",
        "filename": gogglesFile,
        "contentType": "text/html",
        "content": html
      });

      saveFile.send(payload);
    },

    publishProject: function(authToken, project_id) {
      var publish = new XMLHttpRequest();
      publish.open("PUT", publishwmo + "/projects/"+ project_id +"/publish", true);
      publish.setRequestHeader("Authorization", "token " + authToken);
      publish.onload = function(evt) {
        try {
          var result = JSON.parse(publish.response);
          var url = result["publish_url"];
          publishAPI.publishing = false;
          showPublishResult(url);
        } catch(e) {
          console.error("Error parsing XHR response in publishAPI.publishProject", publish.response, e);
        }
      };
      publish.send(null);
    }
  };

  /**
   * [description]
   * @param  {[type]} evt) { vr authToken [description]
   * @return {[type]}      [description]
   */
  function listenForPublish() {
    var publish = document.querySelector("button.publish");
    if(!publish) return;

    publish.addEventListener("click", function(evt) {
      var authToken = localStorage[gogglesAuthLabel];
      if (!!authToken) {
        publish.setAttribute("disabled","disabled");
        publish.textContent = "Publishing...";
        publishAPI.publish(authToken);
      }
      else { console.warn("Goggles cannot publish, because it has not logged in yet."); }
    });
  }

  /**
   * [description]
   * @param  {[type]} ) {               if (!checked) {      checked [description]
   * @return {[type]}   [description]
   */
  window.addEventListener("focus", checkForUser);

  /**
   * [description]
   * @param  {[type]} ) {               window.parent.postMessage("close", "*");  } [description]
   * @return {[type]}   [description]
   */
  var closer = document.querySelector(".close")
  if (closer) {
    closer.addEventListener("click", function() {
      window.parent.postMessage("close", "*");
      localStorage[gogglesDataLabel] = false;
    });
  }

  /**
   * [description]
   * @param  {[type]} event) {               var data [description]
   * @param  {[type]} false  [description]
   * @return {[type]}        [description]
   */
  window.addEventListener("message", function(event) {
    var data = false;
    try { data = JSON.parse(event.data); } catch (e) {}

    // publishable data
    if(data.html && data.originalURL && data.hackpubURL) {
      localStorage[gogglesDataLabel] = JSON.stringify({
        html: data.html,
        url: data.originalURL
      });
    }

    // goggles close: checkUser
    if (data === "close") {
      if (!checkForUser()) {
        logout(true);
      }
    }
  });

  // Make sure to show the correct HTML based on whether we know
  // there is a logged in user or not, then wait for user interaction.
  showLoggedOutHTML();
  checkForUser();

}());
