/**
 * Immediately invoked runner function
 */
(function() {

  var idwmo = "{{ idwmoURL }}";
  var publishwmo = "{{ publishwmoURL }}";

  var gogglesFile = "/index.html";
  var gogglesClientId = "{{ clientId }}";
  var gogglesDataLabel = "goggles-publish-data";
  var gogglesAuthLabel = "goggles-auth-token";

  var checked = false;
  var userdata = false;
  var boundary = 'G0ggl3s';

  var loggedOutTemplate = document.querySelector("script[type='text/html'].loggedout").textContent;
  var loggedInTemplate = document.querySelector("script[type='text/html'].loggedin").textContent;
  var publishedTemplate = document.querySelector("script[type='text/html'].publish").textContent;

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
    container.querySelector(".logout.region").addEventListener("click", function(evt) {
      logout();
    });
    listenForPublish();
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
  }

  /**
   * [triggerLogin description]
   * @return {[type]} [description]
   */
  function triggerLogin() {
    checked = false;
    window.open(
      idwmo + "/login/oauth/authorize?" + [
        "client_id=" + gogglesClientId,
        "response_type=token",
        "scopes=user email",
        "state=goggles"
      ].join("&"),
      null,
      "_blank"
    );
  }

  /**
   * [logout description]
   * @return {[type]} [description]
   */
  function logout(bypass) {
    checked = false;
    userdata = false;
    localStorage.removeItem(gogglesAuthLabel);

    var container = document.querySelector("span.status.placeholder");
    container.innerHTML = loggedOutTemplate;
    container.querySelector("button.login").addEventListener("click", triggerLogin);

    if (!bypass) {
      window.open(idwmo + "/logout?client_id=" + gogglesClientId, null, "_blank");
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
        userdata = {};
        try {
          userdata = JSON.parse(checkUser.response);
          showLoggedInHTML();
          setTimeout(function getUserId() { publishAPI.login(authToken); },1);
        } catch (e) {
          logout(true);
          console.error("Error parsing XHR responsein publishAPI.checkUser", checkUser.response, e);
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
      publishAPI.createProject(authToken);
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
      html = html.replace("</body", "<script src='{{ hostname }}/gogglesnotice.js'></script></body");

      var payload = constructMultipartPayload([{
        "name": "path",
        "content": "/remix.html"
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
    publish.addEventListener("click", function(evt) {
      var authToken = localStorage[gogglesAuthLabel];
      if (!!authToken) { publishAPI.publish(authToken); }
      else { console.warn("Goggles cannot publish, because it has not logged in yet."); }
    });
  }

  /**
   * [description]
   * @param  {[type]} ) {               if (!checked) {      checked [description]
   * @return {[type]}   [description]
   */
  document.addEventListener("focus", checkForUser);

  /**
   * [description]
   * @param  {[type]} ) {            checked [description]
   * @return {[type]}   [description]
   */
  document.addEventListener("blur", function() { checked = false; });

  /**
   * [description]
   * @param  {[type]} ) {               window.parent.postMessage("close", "*");  } [description]
   * @return {[type]}   [description]
   */
  document.getElementById("close").addEventListener("click", function() {
    window.parent.postMessage("close", "*");
    localStorage[gogglesDataLabel] = false;
  });

  /**
   * [description]
   * @param  {[type]} event) {               var data [description]
   * @param  {[type]} false  [description]
   * @return {[type]}        [description]
   */
  window.addEventListener("message", function(event) {
    var data = JSON.parse(event.data);
    if(data.html && data.originalURL && data.hackpubURL) {
      localStorage[gogglesDataLabel] = JSON.stringify({
        html: data.html,
        url: data.originalURL
      });
    }
  });

  // Make sure to show the correct HTML based on whether we know
  // there is a logged in user or not, then wait for user interaction.
  if (!checkForUser()) { logout(true); }
}());
