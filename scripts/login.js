//Define global variables
var serverURL = '';
var site = '';
var modulus = '';
var exponent = '';
var authenticity = '';
var fullURL = '';

console.log("serverURL: "+serverURL);
console.log("site: "+site);
console.log("fullURL: "+fullURL);

function checkLoggedIn() {
	if (fullURL) {
		console.log("Testing Logged in to Tableau Server: "+fullURL+"/projects.xml");
		req.open(
			"GET",
			fullURL+"/projects.xml",
			true);
		
		req.onload = function() {
			if (this.status == "401") {
				console.log("User not logged in");
				var div_serverURL = document.createElement("div");
				div_serverURL.setAttribute('id','serverURL');
				var serURL = document.createElement("input");
				serURL.setAttribute('id','serURL');
				serURL.setAttribute('type','text');
				serURL.setAttribute('value','https://tableauserver.theinformationlab.co.uk');  //<<<<<<<<<<<< REMOVE!!!
				var urlSubmit = document.createElement("button");
				urlSubmit.setAttribute('id','urlSubmit');
				urlSubmit.innerHTML = "Submit";
				urlSubmit.addEventListener('click', serURLSubmit);
				div_serverURL.appendChild(serURL);
				div_serverURL.appendChild(urlSubmit);
				document.body.appendChild(div_serverURL);
			} else {
				tableauDB.open(getWorkbooks);
			}
		};
		req.send(null);
	} else {
				console.log("User not logged in");
				var div_serverURL = document.createElement("div");
				div_serverURL.setAttribute('id','serverURL');
				var serURL = document.createElement("input");
				serURL.setAttribute('id','serURL');
				serURL.setAttribute('type','text');
				serURL.setAttribute('value','https://tableauserver.theinformationlab.co.uk');  //<<<<<<<<<<<< REMOVE!!!
				var urlSubmit = document.createElement("button");
				urlSubmit.setAttribute('id','urlSubmit');
				urlSubmit.innerHTML = "Submit";
				urlSubmit.addEventListener('click', serURLSubmit);
				div_serverURL.appendChild(serURL);
				div_serverURL.appendChild(urlSubmit);
				document.body.appendChild(div_serverURL);
			}
};	


//Function called when Server URL is entered
function serURLSubmit(){
	//Disable submit button
	console.log("serURLSubmit: starting");
	document.querySelector('#urlSubmit').hidden = true;
	
	//Set serverURL variable
	serverURL = document.querySelector('#serURL').value;
	//chrome.storage.sync["serverURL"] = serverURL;
	
	//Get auth.xml
	console.log("serURLSubmit: getting auth xml");
	var authXML = new XMLHttpRequest();
	authXML.open(
		"GET",
		serverURL+"/auth.xml",
		true);
	console.log("serURLSubmit: authXML.onload going to readAuth()");
	authXML.onload = function(){
		modulus = authXML.responseXML.getElementsByTagName("modulus")[0].innerHTML;
		exponent = authXML.responseXML.getElementsByTagName("exponent")[0].innerHTML;
		authenticity = authXML.responseXML.getElementsByTagName("authenticity_token")[0].innerHTML;
		//var headers = authXML.getAllResponseHeaders();
		//console.log("Headers :"+headers);
		console.log(modulus);
		console.log(exponent);
		console.log(authenticity);
		//Show username & password form
		var userField = document.createElement("input");
		userField.setAttribute('id','username');
		userField.setAttribute('type','text');
		var passField = document.createElement("input");
		passField.setAttribute('id','password');
		passField.setAttribute('type','password'); 
		var loginBtn = document.createElement("button");
		loginBtn.setAttribute('id','login');
		loginBtn.innerHTML = "Login";
		loginBtn.addEventListener('click', loginUser);
		document.body.appendChild(userField);
		document.body.appendChild(passField);
		document.body.appendChild(loginBtn);
		loginUser();
	};
	authXML.send(null);
	console.log("serURLSubmit: complete");
};

function loginUser(){
	console.log("LoginUser"); 
	document.querySelector('#login').hidden = true;
	password = document.querySelector('#password').value;
	var authXML = new XMLHttpRequest();
	authXML.open(
		"GET",
		serverURL+"/auth.xml",
		true);
	console.log("LoginUser: authXML.onload going to readAuth()");
	authXML.onload = function(){
		modulus = authXML.responseXML.getElementsByTagName("modulus")[0].innerHTML;
		exponent = authXML.responseXML.getElementsByTagName("exponent")[0].innerHTML;
		authenticity = authXML.responseXML.getElementsByTagName("authenticity_token")[0].innerHTML;
		var RSA = new RSAKey();
		RSA.setPublic(modulus, exponent);
		var res =RSA.encrypt(password);
		console.log(res);
		
		var data = new FormData();
		data.append('crypted', res);
		data.append('authenticity_token', authenticity);
		if (site) {
			data.append('site',site);
			fullURL = serverURL +"/t/"+site;
			//chrome.storage.sync["fullURL"] = fullURL;
		} else {
			fullURL = serverURL;
			//chrome.storage.sync["fullURL"] = fullURL;
		}
		data.append('username', document.querySelector('#username').value);
		console.log(document.querySelector('#username').value);
		console.log(site);
		var loginXML = new XMLHttpRequest();
		loginXML.open(
			"POST",
			serverURL+"/auth/login.xml",
			true);
		loginXML.onload = function(){
			var sites = loginXML.responseXML.getElementsByTagName("site");
			var user = loginXML.responseXML.getElementsByTagName("user");
			if (user.length > 0) {
				console.log("Login Successful");
				document.querySelector('#serverURL').hidden = true;
				document.querySelector('#username').hidden = true;
				document.querySelector('#password').hidden = true;
				document.querySelector('#siteMenu').hidden = true;
				document.querySelector('#submitSite').hidden = true;
				tableauDB.open(getWorkbooks);
			} else if (sites.length > 0) {
				console.log("Select Site");
				var siteMenu = document.createElement("select");
				var siteID = '';
				var siteName = '';
				siteMenu.setAttribute('id','siteMenu');
				for (var i = 0, site; site = sites[i]; i++) {
					siteID = site["id"];
					siteName = site.innerHTML;
					var siteValue = document.createElement("option");
					siteValue.setAttribute('id',siteID);
					siteValue.innerHTML = siteName;
					siteMenu.appendChild(siteValue);
				}
				document.body.appendChild(siteMenu);
				var siteBtn = document.createElement("button");
				siteBtn.setAttribute('id','submitSite');
				siteBtn.innerHTML = "Select";
				siteBtn.addEventListener('click', selectSite);
				document.body.appendChild(siteBtn);
			} else {
				console.log("Error logging in");
				console.log(this.response);
			}
		};
		loginXML.send(data);
		};
	authXML.send(null);
};

function selectSite() {
	site = document.querySelector('#siteMenu').options[document.querySelector('#siteMenu').selectedIndex].id;
	//chrome.storage.sync["site"] = site;
	console.log("Going to site: "+site);
	loginUser();
};

checkLoggedIn();

//Add Listeners to Login Page
//document.addEventListener('DOMContentLoaded', function () {
  //document.querySelector('#urlSubmit').addEventListener('click', serURLSubmit);
// });