//Define global variables
var serverURL = '';
var site = '';
var modulus = '';
var exponent = '';
var authenticity = '';
var fullURL = '';
var siteSelected = false;
var serverName = '';

console.log("serverURL: "+serverURL);
console.log("site: "+site);
console.log("fullURL: "+fullURL);

function initializeScreen(){
	var loadingdiv = document.createElement("div");
	loadingdiv.setAttribute('class','ajax-loading');
	var loaddiv = document.createElement("div");
	loaddiv.setAttribute('id','loadingMsg');
	loadingdiv.appendChild(loaddiv);
	document.body.appendChild(loadingdiv);

	checkLoggedIn();
}

function checkLoggedIn() {
	if (fullURL) {
		console.log("Testing Logged in to Tableau Server: "+fullURL+"/vizportal/api/web/v1/getSessionInfo");
		req.open(
			"GET",
			fullURL+"/vizportal/api/web/v1/getSessionInfo",
			true);

		req.onload = function() {
			if (this.status == "401") {
				console.log("User not logged in");
				var div_serverLogin = document.createElement("div");
				div_serverLogin.setAttribute('id','serverLogin');
				var serURL = document.createElement("input");
				serURL.setAttribute('id','serURL');
				serURL.setAttribute('type','text');
				var urlSubmit = document.createElement("button");
				urlSubmit.setAttribute('id','urlSubmit');
				urlSubmit.innerHTML = "Submit";
				urlSubmit.addEventListener('click', serURLSubmit);
				div_serverLogin.appendChild(serURL);
				div_serverLogin.appendChild(urlSubmit);
				document.body.appendChild(div_serverLogin);
			} else {
				tableauDB.open(getWorkbooks);
			}
		};
		req.send(null);
	} else {
				console.log("User not logged in");
				var div_serverLogin = document.createElement("div");
				div_serverLogin.setAttribute('id','serverLogin');
				var serURL = document.createElement("input");
				serURL.setAttribute('id','serURL');
				serURL.setAttribute('type','text');
				serURL.setAttribute('value','https://tableauserver.theinformationlab.co.uk');  //<<<<<<<<<<<< REMOVE!!!
				var urlSubmit = document.createElement("button");
				urlSubmit.setAttribute('id','urlSubmit');
				urlSubmit.innerHTML = "Submit";
				urlSubmit.addEventListener('click', serURLSubmit);
				div_serverLogin.appendChild(serURL);
				div_serverLogin.appendChild(urlSubmit);
				document.body.appendChild(div_serverLogin);
			}
};

//Function from http://papermashup.com/read-url-get-variables-withjavascript/
function getUrlVars(url) {
	var vars = {};
	var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
	vars[key] = value;
	});
	return vars;
}

//Function called when Server URL is entered
function serURLSubmit(){
	//Disable submit button
	console.log("serURLSubmit: starting");
	document.querySelector('#urlSubmit').hidden = true;

	//Set serverURL variable
	serverURL = document.querySelector('#serURL').value;
	//chrome.storage.sync["serverURL"] = serverURL;

	//Get server info
	console.log("serURLSubmit: getting server info");
	var settings = {
  "async": true,
  "crossDomain": true,
  "url": serverURL+"/vizportal/api/web/v1/getServerSettingsUnauthenticated",
  "method": "POST",
	  "data": "{\"method\":\"getServerSettingsUnauthenticated\",\"params\":{}}"
	}

	$.ajax(settings).done(function (response) {
		var serverLogo = response.result.customization.customLogoPath;
		if (serverLogo){
			var imageURL = serverURL + serverLogo;
			console.log(imageURL);
			var logoDiv = document.createElement("div");
			var logoIMG = document.createElement("img");
			logoDiv.setAttribute('class','serverLogo');
			logoDiv.setAttribute('id','serverLogo');
			logoIMG.setAttribute('src',imageURL);
			logoDiv.appendChild(logoIMG);
			document.body.appendChild(logoDiv);
		}
		if (response.result.authenticationType.type == "SAML") {
			console.log("SAML Login");
			var win = gui.Window.open (serverURL+"/vizportal/api/saml?dest=%2F", {
  			position: 'center',
  			width: 901,
  			height: 600,
				toolbar: false
			});
			win.on ('loaded', function(){
				var curURL = win.window.location.href;
				if (getUrlVars(curURL)[":isFromSaml"] == "y") {
					serverURL = win.window.location.protocol + '//' + win.window.location.host + win.window.location.pathname;
					console.log("New Server URL = " + serverURL);
					require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
		    		cookies.forEach(function(cookie) {
		        	if (cookie.name == "workgroup_session_id") {
								workgroup_session_id = cookie.value;
							} else if (cookie.name == "XSRF-TOKEN") {
								xsrf_token = cookie.value;
							}
		    		})
						win.close();
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
							$('#serverLogin').hide();
							currentSiteLuid = response.result.site.luid;
							deleteDB('tableau');
							tableauDB.open(checkAPIAccess);
						});
					});
				}
			});
		} else {
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
			passField.setAttribute('type','password');
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
			passField.addEventListener('focusin', function(){
				if (passField.value=="Password") {
					passField.setAttribute('type','password');
					passField.value="";
					passField.setAttribute('style','');
				}
			}, false);
			div_serverLogin.appendChild(serverName);
			div_serverLogin.appendChild(userField);
			div_serverLogin.appendChild(passField);
			div_serverLogin.appendChild(loginBtn);
		}
	});
	console.log("serURLSubmit: complete");
};

function loginUser(){
	console.log("LoginUser");
	document.querySelector('#login').hidden = true;
	username = document.querySelector('#username').value;
	password = document.querySelector('#password').value;

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/generatePublicKey",
	  "method": "POST",
	  "data": "{\"method\":\"generatePublicKey\",\"params\":{}}"
	}

	$.ajax(settings).done(function (response) {
	  var keyID = response.result.keyId;
		var key = response.result.key;
		var res = rsa.encrypt(password, key)
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": serverURL+"/vizportal/api/web/v1/login",
		  "method": "POST",
		  "data": "{\"method\":\"login\",\"params\":{\"username\":\""+username+"\",\"encryptedPassword\":\""+res+"\",\"keyId\":\""+keyID+"\"}}"
		}

		$.ajax(settings).done(function (response, textStatus, jqXHR) {
			require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
    		cookies.forEach(function(cookie) {
        	if (cookie.name == "workgroup_session_id") {
						workgroup_session_id = cookie.value;
					} else if (cookie.name == "XSRF-TOKEN") {
						xsrf_token = cookie.value;
					}
    		})
			});
			$('#serverLogin').hide();
			currentSiteLuid = response.result.site.luid;
			deleteDB('tableau');
			tableauDB.open(checkAPIAccess);
		});
	});
};

function switchSiteLogin(site){
	console.log("Switching Site to "+site);
	var settingsA = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getServerSettingsUnauthenticated",
	  "method": "POST",
	  "headers": {
	    "X-XSRF-TOKEN": xsrf_token
	  },
	  "data": "{\"method\":\"getServerSettingsUnauthenticated\",\"params\":{}}"
	}

	$.ajax(settingsA).done(function (responseA) {
			var settingsB = {
			  "async": false,
			  "crossDomain": true,
			  "url": serverURL+"/vizportal/api/web/v1/switchSite",
			  "method": "POST",
			  "headers": {
			    "X-XSRF-TOKEN": xsrf_token
			  },
			  "data": "{\"method\":\"switchSite\",\"params\":{\"urlName\":\""+site+"\"}}"
			}
			$.ajax(settingsB).done(function (responseB) {
				require('nw.gui').Window.get().cookies.getAll({}, function(cookies) {
					cookies.forEach(function(cookie) {
						if (cookie.name == "workgroup_session_id") {
							workgroup_session_id = cookie.value;
						} else if (cookie.name == "XSRF-TOKEN") {
							xsrf_token = cookie.value;
						}
					})
					var settingsC = {
					  "async": false,
					  "crossDomain": true,
					  "url": serverURL+"/vizportal/api/web/v1/getSessionInfo",
					  "method": "POST",
					  "headers": {
					    "x-xsrf-token": xsrf_token
					  },
					  "data": "{\"method\":\"getSessionInfo\",\"params\":{}}"
					}
					$.ajax(settingsC).done(function (responseC) {
						updateSiteInfo(responseC.result.site);
						//getServerElements_noAPI();
					});
				});
			});
	});

};

initializeScreen();
