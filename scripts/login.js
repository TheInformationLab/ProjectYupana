//Define global variables
var serverURL = '';
var site = '';
var modulus = '';
var exponent = '';
var authenticity = '';
var fullURL = '';
var siteSelected = false;

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
				serURL.setAttribute('value','https://beta.theinformationlab.co.uk');  //<<<<<<<<<<<< REMOVE!!!
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
				serURL.setAttribute('value','https://beta.theinformationlab.co.uk');  //<<<<<<<<<<<< REMOVE!!!
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
	getServerLogo();
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
		loginBtn.addEventListener('click', function(){
			loginUser();
		}, false);
		document.body.appendChild(userField);
		document.body.appendChild(passField);
		document.body.appendChild(loginBtn);
	};
	authXML.send(null);
	console.log("serURLSubmit: complete");
};

function loginUser(site, callback){
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
		var res = RSA.encrypt(password);
		console.log(res);
		var data = new FormData();
		data.append('crypted', res);
		data.append('authenticity_token', authenticity);
		if (!siteSelected) {
			fullURL = serverURL;
		} else {
			data.append('target_site',site);
		}
		data.append('username', document.querySelector('#username').value);
		console.log(document.querySelector('#username').value);
		console.log("Site " + site);
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
				deleteDB('tableau');
				tableauDB.open(checkAPIAccess);
			} else if (sites.length > 0 && !site) {
				console.log("Fresh Login, going to default site")
				var defaultSiteID = sites[0].getAttribute("id");
				console.log("Default site ID: "+ defaultSiteID);
				if (defaultSiteID.length > 0) {
					fullURL = serverURL +"/t/"+defaultSiteID;
				} else {
					fullURL = serverURL;
				}
				siteSelected = true;
				loginUser(defaultSiteID);
			} else if (site) {
				console.log("Logging into site "+site);
				if (site.length > 0) {
					fullURL = serverURL +"/t/"+site;
					siteSelected = true;
				} 
				loginUser(site);
			} else {
				console.log("Error logging in");
				console.log(this.response);
			}
		};
		loginXML.send(data);
		};
	authXML.send(null);
};

function switchSite(site){
	console.log("Switching Site"); 
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
		var res = RSA.encrypt(password);
		console.log(res);
		var data = new FormData();
		data.append('crypted', res);
		data.append('authenticity_token', authenticity);
		if (!siteSelected) {
			fullURL = serverURL;
		} else {
			data.append('target_site',site);
		}
		data.append('username', document.querySelector('#username').value);
		console.log(document.querySelector('#username').value);
		console.log("Site " + site);
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
				tableauDB.open(getUsers_noAPI);
			} else if (sites.length > 0 && !site) {
				console.log("Fresh Login, going to default site")
				var defaultSiteID = sites[0].getAttribute("id");
				console.log("Default site ID: "+ defaultSiteID);
				if (defaultSiteID.length > 0) {
					fullURL = serverURL +"/t/"+defaultSiteID;
				} else {
					fullURL = serverURL;
				}
				siteSelected = true;
				loginUser(defaultSiteID);
			} else if (site) {
				console.log("Logging into site "+site);
				if (site.length > 0) {
					fullURL = serverURL +"/t/"+site;
					siteSelected = true;
				} 
				loginUser(site);
			} else {
				console.log("Error logging in");
				console.log(this.response);
			}
		};
		loginXML.send(data);
		};
	authXML.send(null);
};

checkLoggedIn();
initializeScreen();

//Add Listeners to Login Page
//document.addEventListener('DOMContentLoaded', function () {
  //document.querySelector('#urlSubmit').addEventListener('click', serURLSubmit);
// });