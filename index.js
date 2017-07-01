var __td = (function() {
  'use strict';

  var company_users_info_api,
      tasks_api,
      company_id,
      user_id,
      authenticate,
      user_info_div,
      companyName;

  var tokenFetcher = (function() {

    var clientId = '739_2czm4ff0m2ask888o88g8ow04cocww8wcskk0kk0cg0w0k4wwk';  // <YOUR_CLIENT_ID>
    var clientSecret = '3305ncep6s84c0oog8wk0g4cggcsg080go0k04kwwcowk4kssc';  // <YOUR_CLIENT_SECRET>
    var redirectUri = chrome.identity.getRedirectURL('provider_cb');          // Redirect URL set on the app registration page
    var redirectRe = new RegExp(redirectUri + '[#\?](.*)');

    var access_token = null;

    return {
      getToken: function(interactive, callback) {
        // In case we already have an access_token cached, simply return it.
        if (access_token) {
          callback(null, access_token);
          return;
        }

        var options = {
          'interactive': interactive,
          'url': 'https://webapi.timedoctor.com/oauth/v2/auth?' +
                 'client_id=' + clientId +
                 '&response_type=code&redirect_uri=' + encodeURIComponent(redirectUri)
        }
        chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
          console.log('launchWebAuthFlow completed', chrome.runtime.lastError,
              redirectUri);

          if (chrome.runtime.lastError) {
            callback(new Error(chrome.runtime.lastError));
            return;
          }

          var matches = redirectUri.match(redirectRe);
          console.log(matches);
          if (matches && matches.length > 1)
            handleProviderResponse(parseRedirectFragment(matches[1]));
          else
            callback(new Error('Invalid redirect URI'));
        });

        function parseRedirectFragment(fragment) {
          var pairs = fragment.split(/&/);
          var values = {};

          pairs.forEach(function(pair) {
            var nameval = pair.split(/=/);
            values[nameval[0]] = nameval[1];
          });
          return values;
        }

        function handleProviderResponse(values) {
          console.log('providerResponse', values);
          if (values.hasOwnProperty('code'))
            exchangeCodeForToken(values.code);
          else 
            callback(new Error('Authorization code not avialable.'));
        }

        function exchangeCodeForToken(code) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET',
                   'https://webapi.timedoctor.com/oauth/v2/token?' +
                   'client_id=' + clientId +
                   '&client_secret=' + clientSecret +
                   '&grant_type=authorization_code&redirect_uri=' + redirectUri +
                   '&code=' + code);
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.onload = function () {
            if (this.status === 200) {
              var response = JSON.parse(this.responseText);
              if (response.hasOwnProperty('access_token')) setAccessToken(response.access_token);
              else callback(new Error('Cannot obtain access_token from code.'));
            } 
            else {
              console.log('code exchange status:', this.status);
              callback(new Error('Code exchange failed'));
            }
          };
          xhr.send();
        }

        function setAccessToken(token) {
          access_token = token; 
          console.log('Setting access_token: ', access_token);
          callback(null, access_token);
        }
      },

      removeCachedToken: function(token_to_remove) {
        if (access_token == token_to_remove)
          access_token = null;
      }
    }
  })();

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;

    console.log('xhrWithAuth', method, url, interactive);
    getToken();

    function getToken() {
      tokenFetcher.getToken(interactive, function(error, token) {
        console.log('token fetch', error, token);
        if (error) {
          callback(error);
          return;
        }
        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      console.log('requestComplete', this.status, this.response);
      if ( ( this.status < 200 || this.status >=300 ) && retry) {
        retry = false;
        tokenFetcher.removeCachedToken(access_token);
        access_token = null;
        getToken();
      } 
      else callback(null, this.status, this.response);
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET', 'https://webapi.timedoctor.com/v1.1/companies', interactive, onUserInfoFetched);
  }

  // Functions updating the User Interface:

  function showButton(button) {
    button.style.display = 'inline';
    button.disabled = false;
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      console.log("Got the following user info: " + response);
      var user_info = JSON.parse(response); 
      company_id = user_info.accounts[0].company_id; 
      user_id = user_info.accounts[0].user_id;
      company_users_info_api = user_info.user.url + '/' + company_id + '/' + 'users'; 
      tasks_api = company_users_info_api + '/' + user_id + '/' + 'tasks'; 

      populateUserInfo(user_info);
      hideButton(authenticate);
      fetchCompanyInfo(company_users_info_api);
      fetchTasksInfo(tasks_api);
    } else {
      console.log('infoFetch failed', error, status);
      showButton(authenticate);
    }
  }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = "Hello, " + "<strong>" + user_info.user.full_name + "</strong><br>"
      + "Your Company ID: " + "<strong>" + user_info.accounts[0].company_id + "</strong>" + ' & User ID: ' + "<strong>" + user_info.accounts[0].user_id + "</strong>";
    elem.appendChild(nameElem);

    var name = companyName;
    var titlElem = document.createElement('span');
    titlElem.innerHTML = "Company name: " + "<strong>" + user_info.accounts[0].company_name + "</strong>";
    name.appendChild(titlElem);
  }

  function fetchCompanyInfo(userApi) {
    xhrWithAuth('GET', userApi, false, onUserFetched);
  }

  function fetchTasksInfo(tasksApi) {
    xhrWithAuth('GET', tasksApi, false, onTasksFetched);
  }

  function onUserFetched(error, status, response) {
    var elem = document.querySelector('#company_users');
    elem.value='';
    if (!error && status == 200) {
      console.log("Got the following user company details:", response);
      var company_users = JSON.parse(response); console.log(company_users);
      var user_details = '';
      for (var i = 0; i < company_users.users.length; i++) {
        var ind_user = 'Name: ' + company_users.users[i].full_name + '\n' + 'Email: ' + company_users.users[i].email + '\n' + 'User Level: ' + company_users.users[i].level;
        user_details += ind_user + '\n\n';
      }
      elem.value = '\n' + 'List of all the users in the company: ' + '\n\n' + user_details;
    } 
    else console.log('infoFetch failed', error, status);    
  }

  function onTasksFetched(error, status, response) {
    var el = document.querySelector('#tasks_name');
    el.value='';
    if (!error && status == 200) {
      console.log("Got the following user company details:", response);
      var user_tasks = JSON.parse(response); console.log(user_tasks);
      var task_details = '';

      for (var j = 0; j < user_tasks.tasks.length; j++) {
        var ind_task = 'Task ID: ' + user_tasks.tasks[j].task_id + '\n' + 'Project ID: ' + user_tasks.tasks[j].project_id + '\n' + 'Task Name: ' + user_tasks.tasks[j].task_name + '\n' + 'Active: ' + user_tasks.tasks[j].active;
        task_details += ind_task + '\n\n';
      }
      el.value = '\n' + 'List of all the tasks created by the user: ' + '\n\n' + task_details;
    } 
    else console.log('infoFetch failed', error, status);    
  }

  // Handlers for the buttons's onclick events.

  function interactiveSignIn() {
    disableButton(authenticate);
    tokenFetcher.getToken(true, function(error, access_token) {
      if (error) showButton(authenticate); 
      else getUserInfo(true);
    });
  }

  return {
    onload: function () {
      authenticate = document.querySelector('#authenticate');
      authenticate.onclick = interactiveSignIn;
      user_info_div = document.querySelector('#user_info');
      companyName = document.querySelector('#title');

      showButton(authenticate);
      getUserInfo(false);
    }
  };
})();

window.onload = __td.onload;
