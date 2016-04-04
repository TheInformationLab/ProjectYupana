//Define global variables
var loginLogger = winston.loggers.get('login');
var serverURL = '';
var serverName = '';

function initializeScreen(){
	loginLogger.verbose('initializeScreen',{'state':'Starting initializeScreen','serverURL':serverURL});
	var loadingdiv = document.createElement("div");
	loadingdiv.setAttribute('class','ajax-loading');
	var loaddiv = document.createElement("div");
	loaddiv.setAttribute('id','loadingMsg');
	loadingdiv.appendChild(loaddiv);
	document.body.appendChild(loadingdiv);
	tableauDB.open(checkLoggedIn);
}

var getSessionInfo = function(callback) {
	loginLogger.info('getSessionInfo',{'state':'Calling getSessionInfo API','serverURL':serverURL});
	var settings = {
		"async": false,
		"crossDomain": true,
		"url": serverURL+"/vizportal/api/web/v1/getSessionInfo",
		"method": "POST",
		"headers": {
			"x-xsrf-token": xsrf_token
		},
		"data": "{\"method\":\"getSessionInfo\",\"params\":{}}"
	}
	$.ajax(settings).done(function (response) {
		currentSiteLuid = response.result.site.luid;
		currentSiteName = response.result.site.name;
		currentSiteId = response.result.site.name;
		currentSiteUrl = response.result.site.urlName;
		callback(response);
	}).fail(function (err) {
		loginLogger.error('getSessionInfo',err);
		callback(err);
	}).always(function (response) {
		loginLogger.debug('getSessionInfo',response);
	});
}

function showLogin() {
	loginLogger.verbose('showLogin',{'state':'Showing server URL input','serverURL':serverURL});
	var div_serverLogin = document.createElement("div");
	div_serverLogin.setAttribute('id','serverLogin');
	var serURL = document.createElement("div");
	serURL.setAttribute('id','serURL');
	var urlSubmit = document.createElement("button");
	urlSubmit.setAttribute('id','urlSubmit');
	urlSubmit.innerHTML = "Submit";
	urlSubmit.addEventListener('click', serURLSubmit);
	div_serverLogin.appendChild(serURL);
	document.body.appendChild(div_serverLogin);
	tableauDB.fetchRecords(0,"servers",function(servers) {
		loginLogger.debug('showLogin',servers);
		var serverList = [];
		for (var i = 0; i < servers.length; i++) {
			serverList.push(servers[i].serverUrl);
		};
		var ms = $('#serURL').magicSuggest({
			allowFreeEntries : true,
			placeholder : "Tableau Server URL",
			data: serverList,
			highlight: false,
			maxSelection: 1,
			vtype: 'url',
			toggleOnClick: true,
			vregex: /[https]{4,5}:\/\/[\w\.]*/
		});
		$(ms).on('selectionchange', function(e,m) {
			if (this.getValue().length == 0) {
				if($('#serverName')){
					$('#serverName').remove();
				}
				if($('#username')){
					$('#username').remove();
				}
				if($('#password')){
					$('#password').remove();
				}
				if($('#login')){
					$('#login').remove();
				}
				$('#urlSubmit').show();
			} else {
				//$('#urlSubmit').hide();
				serverURL = this.getValue()[0];
				loginLogger.info('showLogin',{'state':'New server url','serverURL':serverURL});
				serURLSubmit();
			}
		});
	});
}

function checkLoggedIn() {
	loginLogger.verbose('checkLoggedIn',{'state':'Checking whether user is logged in','serverURL':serverURL});
	require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
		cookies.forEach(function(cookie) {
			loginLogger.debug('checkLoggedIn',cookie);
			if (cookie.name == "workgroup_session_id") {
				workgroup_session_id = cookie.value;
				if(cookie.secure) {
					serverURL = 'https://'+cookie.domain;
				} else {
					serverURL = 'http://'+cookie.domain;
				}
			} else if (cookie.name == "XSRF-TOKEN") {
				xsrf_token = cookie.value;
			}
		})
		if (serverURL) {
			loginLogger.info('checkLoggedIn',{'state':'New server url','serverURL':serverURL});
			loginLogger.info('checkLoggedIn',{'state':'Testing Logged in to Tableau Server','serverURL':serverURL});
			getSessionInfo(function (response) {
				if (response.status != "200") {
					loginLogger.verbose('checkLoggedIn',{'state':'User not logged in. Showing login screen','serverURL':serverURL});
					showLogin();
				} else {
					loginLogger.verbose('checkLoggedIn',{'state':'Valid user credentials','serverURL':serverURL,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
					initialiseYupana();
				}
			});
		} else {
			loginLogger.verbose('checkLoggedIn',{'state':'No cookie present. Showing login screen','serverURL':serverURL});
			showLogin();
		}
	});
};

//Function from http://papermashup.com/read-url-get-variables-withjavascript/
function getUrlVars(url) {
	var vars = {};
	var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	vars[key] = value;
	});
	return vars;
}

function serURLSubmit(){
	loginLogger.verbose('serURLSubmit',{'state':'Getting Server Info','serverURL':serverURL});
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getServerSettingsUnauthenticated",
	  "method": "POST",
		"headers": {
	    "accept": "application/json, text/plain, */*",
			"content-type": "application/json;charset=UTF-8"
		},
		"data": "{\"method\":\"getServerSettingsUnauthenticated\",\"params\":{}}"
	}

	$.ajax(settings).done(function (response) {
		var serverLogo = response.result.customization.customLogoPath;
		if (serverLogo){
			var imageURL = serverURL + serverLogo;
		} else {
			var imageURL = './images/til.png';
		}
		var logoDiv = document.createElement("div");
		var logoIMG = document.createElement("img");
		logoDiv.setAttribute('class','serverLogo');
		logoDiv.setAttribute('id','serverLogo');
		logoIMG.setAttribute('src',imageURL);
		logoDiv.appendChild(logoIMG);
		document.body.appendChild(logoDiv);
		if (response.result.authenticationType.type == "SAML") {
			loginLogger.verbose('serURLSubmit',{'state':'SAML Login','serverURL':serverURL});
			var win = gui.Window.open (serverURL+"/vizportal/api/saml?dest=%2F", {
  			position: 'center',
  			width: 901,
  			height: 600,
				toolbar: false,
				title: "Project Yupana, SAML Login - The Information Lab"
			});
			win.on ('loaded', function(){
				var curURL = win.window.location.href;
				loginLogger.verbose('serURLSubmit',{'state':'SAML Login window loaded','loginURL':curURL ,'serverURL':serverURL});
				if (getUrlVars(curURL)[":isFromSaml"] == "y") {
					loginLogger.verbose('serURLSubmit',{'state':'Successful SAML login detected','loginURL':curURL ,'serverURL':serverURL});
					serverURL = win.window.location.protocol + '//' + win.window.location.host + win.window.location.pathname;
					loginLogger.info('serURLSubmit',{'state':'New server url', 'url':serverURL});
					require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
		    		cookies.forEach(function(cookie) {
		        	if (cookie.name == "workgroup_session_id") {
								workgroup_session_id = cookie.value;
							} else if (cookie.name == "XSRF-TOKEN") {
								xsrf_token = cookie.value;
							}
		    		})
						win.close();
						getSessionInfo(function (response) {
							loginLogger.verbose('serURLSubmit',{'state':'Valid user credentials','serverURL':serverURL,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
							$('#serverLogin').hide();
							initialiseYupana();
						});
					});
				}
			});
		} else {
			loginLogger.verbose('serURLSubmit',{'state':'Local/AD Login','serverURL':serverURL});
			var div_serverLogin = document.getElementById("serverLogin");
			var serverName = document.createElement("div");
			serverName.innerHTML = response.result.customization.serverName;
			serverName.setAttribute('id','serverName');
			serverName.setAttribute('style','padding-top:10px;');
			var userField = document.createElement("input");
			userField.setAttribute('id','username');
			userField.setAttribute('type','text');
			userField.setAttribute('style','color:#BDBDBD;font-style: italic;');
			var passField = document.createElement("input");
			passField.setAttribute('id','password');
			passField.setAttribute('type','text');
			passField.setAttribute('style','color:#BDBDBD;font-style: italic;');
			var loginBtn = document.createElement("button");
			loginBtn.setAttribute('id','login');
			loginBtn.innerHTML = "Login";
			loginBtn.addEventListener('click', function(){
				loginUser();
			}, false);
			userField.addEventListener('focusin', function(){
				if (userField.value=="Username") {
					userField.value="";
					userField.setAttribute('style','');
				}
			}, false);
			userField.addEventListener('focusout', function(){
				if (userField.value=="") {
					userField.value="Username";
					userField.setAttribute('style','color:#BDBDBD;font-style: italic;');
				}
			}, false);
			passField.addEventListener('focusin', function(){
				if (passField.value=="Password") {
					passField.setAttribute('type','password');
					passField.value="";
					passField.setAttribute('style','');
				}
			}, false);
			passField.addEventListener('focusout', function(){
				if (passField.value=="") {
					passField.setAttribute('type','text');
					passField.value="Password";
					passField.setAttribute('style','color:#BDBDBD;font-style: italic;');
				}
			}, false);
			div_serverLogin.appendChild(serverName);
			div_serverLogin.appendChild(userField);
			div_serverLogin.appendChild(passField);
			div_serverLogin.appendChild(loginBtn);
			$('#username').val('Username');
			$('#password').val('Password');
		}
	}).fail(function(err) {
		loginLogger.error('serURLSubmit',err);
	}).always(function(response) {
		loginLogger.debug('serURLSubmit',response);
	});
};

function loginUser(){
	loginLogger.verbose('loginUser',{'state':'Logging in User','serverURL':serverURL});
	document.querySelector('#login').hidden = true;
	username = document.querySelector('#username').value;
	password = document.querySelector('#password').value;
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/generatePublicKey",
	  "method": "POST",
		"headers": {
	    "accept": "application/json, text/plain, */*",
			"content-type": "application/json;charset=UTF-8"
		},
	  "data": "{\"method\":\"generatePublicKey\",\"params\":{}}"
	}
	$.ajax(settings).done(function (response) {
		loginLogger.verbose('loginUser',{'state':'Generated public key','serverURL':serverURL});
	  var keyID = response.result.keyId;
		var key = response.result.key;
		var res = rsa.encrypt(password, key)
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": serverURL+"/vizportal/api/web/v1/login",
		  "method": "POST",
			"headers": {
		    "accept": "application/json, text/plain, */*",
				"content-type": "application/json;charset=UTF-8"
			},
		  "data": "{\"method\":\"login\",\"params\":{\"username\":\""+username+"\",\"encryptedPassword\":\""+res+"\",\"keyId\":\""+keyID+"\"}}"
		}
		$.ajax(settings).done(function (response, textStatus, jqXHR) {
			getSessionCookies(function(workgroup_session, xsrf) {
				workgroup_session_id = workgroup_session;
				xsrf_token = xsrf;
				loginLogger.verbose('loginUser',{'state':'Valid user credentials','serverURL':serverURL,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
				$('#serverLogin').hide();
				currentSiteLuid = response.result.site.luid;
				currentSiteName = response.result.site.name;
				currentSiteId = response.result.site.name;
				currentSiteUrl = response.result.site.urlName;
				initialiseYupana();
			});
		}).fail(function(err) {
			loginLogger.error('loginUser',err);
		}).always(function(response){
			loginLogger.debug('loginUser',response);
		});
	}).fail(function(err) {
		loginLogger.error('loginUser',err);
	}).always(function(response) {
		loginLogger.debug('loginUser',response);
	});
};

var getServerSettingsUnauthenticated = function (callback) {
	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getServerSettingsUnauthenticated",
	  "method": "POST",
	  "headers": {
	    "X-XSRF-TOKEN": xsrf_token,
		  "accept": "application/json, text/plain, */*",
			"content-type": "application/json;charset=UTF-8"
	  },
	  "data": "{\"method\":\"getServerSettingsUnauthenticated\",\"params\":{}}"
	}
	$.ajax(settings).done(function (response) {
		callback(response);
	}).fail(function(err) {
		loginLogger.error('getServerSettingsUnauthenticated',err);
	}).always(function(response){
		loginLogger.debug('getServerSettingsUnauthenticated',response);
	});
}

var letsSwitchSite = function (site, callback) {
	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/switchSite",
	  "method": "POST",
	  "headers": {
	    "X-XSRF-TOKEN": xsrf_token,
			"accept": "application/json, text/plain, */*",
			"content-type": "application/json;charset=UTF-8"
	  },
	  "data": "{\"method\":\"switchSite\",\"params\":{\"urlName\":\""+site+"\"}}"
	}
	$.ajax(settings).done(function (response) {
		loginLogger.verbose('letsSwitchSite',{'state':'Swited site','serverURL':serverURL});
		callback(response);
	}).fail(function(err) {
		loginLogger.error('letsSwitchSite',err);
	}).always(function(response){
		loginLogger.debug('letsSwitchSite',response);
	});;
}

var getSessionCookies = function (callback) {
	require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
		cookies.forEach(function(cookie) {
			if (cookie.name == "workgroup_session_id") {
				workgroup_session_id = cookie.value;
			} else if (cookie.name == "XSRF-TOKEN") {
				xsrf_token = cookie.value;
			}
		});
		callback(workgroup_session_id, xsrf_token);
	});
}



function switchSiteLogin(site){
	loginLogger.verbose('switchSiteLogin',{'state':'Switching site','serverURL':serverURL,'site':site,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
	getServerSettingsUnauthenticated(function(response) {
		letsSwitchSite(site, function(response){
			getSessionCookies(function(workgroup_session, xsrf) {
				workgroup_session_id = workgroup_session;
				xsrf_token = xsrf;
				loginLogger.verbose('switchSiteLogin',{'state':'Valid user credentials','serverURL':serverURL,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
				getSessionInfo(function(response) {
					loginLogger.verbose('switchSiteLogin',{'state':'Switched site','serverURL':serverURL,'site':response.result.site,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
					updateSiteInfo(response.result.site);
				});
			});
		});
	});
};

function switchSiteResource(site, callback){
	loginLogger.verbose('switchSiteResource',{'state':'Switching site','serverURL':serverURL,'site':site,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
	getServerSettingsUnauthenticated(function(response) {
		console.log("Switching to site "+site);
		letsSwitchSite(site, function(response){
			getSessionCookies(function(workgroup_session, xsrf) {
				workgroup_session_id = workgroup_session;
				xsrf_token = xsrf;
				loginLogger.verbose('switchSiteResource',{'state':'Valid user credentials','serverURL':serverURL,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
				getSessionInfo(function(response) {
					loginLogger.verbose('switchSiteResource',{'state':'Switched site','serverURL':serverURL,'site':response.result.site,'xsrf':xsrf_token,'workgroup':workgroup_session_id});
					callback(response);
				});
			});
		});
	});
};

initializeScreen();
