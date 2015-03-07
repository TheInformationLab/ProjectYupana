var apiToken = "";
var apiLevel = 0;
var siteCount = 0;
var userCount = 0;
var viewCount = 0;
var curUserCount = 0;
var curViewCount = 0;
var curCurrentSite = 0;
var sitesList = [];

function checkAPIAccess() {
	$('.ajax-loading').show();
	console.log("Check API Access");
	var loginXML = '<tsRequest><credentials name="'+ document.querySelector('#username').value + '" password="'+document.querySelector('#password').value+'" ><site contentUrl="" /></credentials></tsRequest>'
	var loginResponse = new XMLHttpRequest();
	loginResponse.open(
		"POST",
		serverURL+"/api/2.0/auth/signin",
		true);
	loginResponse.onload = function(){
		var apiStatus = document.createElement("h4");
		apiStatus.setAttribute('id','apiStatus');
		if (this.status == "404") {
			apiStatus.innerHTML = "REST API Degraded";
			apiLevel = 0;
		} else {
			credentials = loginResponse.responseXML.getElementsByTagName("credentials");
			apiToken = credentials[0].getAttribute("token");
			console.log("REST API Token: "+apiToken);
			apiStatus.innerHTML = "REST API Active";
			console.log("REST API Login Complete");
			apiLevel = 1;
		}
		document.body.appendChild(apiStatus);
		if (apiLevel == 0) {
			getSites_noAPI();
		} else if (apiLevel == 1) {
			getSites_API();
		}
	};
	loginResponse.send(loginXML);
}

function getServerLogo(){
	var logoXML = new XMLHttpRequest();
	logoXML.open (
		"GET",
		serverURL+"/auth/",
		true);
	logoXML.onload = function() {
		var pageHTML = logoXML.responseText;
		var header = pageHTML.substr(pageHTML.search("img"),100);
		header = header.substr(header.search("src")+5,100);
		header = header.substr(0,header.search('"'));
		console.log(header);
		var imageURL = serverURL + header;
		var logoDiv = document.createElement("div");
		var logoIMG = document.createElement("img");
		logoDiv.setAttribute('class','serverLogo');
		logoDiv.setAttribute('id','serverLogo');
		logoIMG.setAttribute('src',imageURL);
		logoDiv.appendChild(logoIMG);
		document.body.appendChild(logoDiv);
	}
	logoXML.send();
}

function getSites_noAPI(){
	console.log("Getting Site List");
	var sitesXML = new XMLHttpRequest();
	sitesXML.open(
		"GET",
		serverURL+"/sites.xml",
		true);
	sitesXML.onload = function() {
		sites = sitesXML.responseXML.getElementsByTagName("site");
		siteCount = sites.length;
		currentSite = 0;
		for (var i = 0, site; site = sites[i]; i++) {
			var siteID = site.getElementsByTagName("id")[0].innerHTML;
			var friendlyName = site.getElementsByTagName("name")[0].innerHTML;
			var url_namespace = site.getElementsByTagName("url_namespace")[0].innerHTML;
			var user_quota = site.getElementsByTagName("user_quota")[0].innerHTML;
			var content_admin_mode = site.getElementsByTagName("content_admin_mode")[0].innerHTML;
			var storage_quota = site.getElementsByTagName("storage_quota")[0].innerHTML;
			tableauDB.createSite(siteID, friendlyName, url_namespace, user_quota, content_admin_mode, storage_quota, function() {
				console.log("Site "+friendlyName+" saved!");
				currentSite++;
				if (currentSite == siteCount) {
					console.log("All sites saved!")
					tableauDB.fetchRecords(0,"sites", function(sites) {
						sitesList = sites;
						getUsers_noAPI();
						initiliseStatsTiles();
						document.getElementById("loadingMsg").innerHTML = "Getting Default Site";
					});
				}
			});
		}
		var siteContainer = document.createElement("div");
		siteContainer.setAttribute('id','siteContainer');
		var siteItem = document.createElement("div");
		siteItem.setAttribute('class','item');
		siteItem.setAttribute('id','item');
		siteItem.innerHTML = "<h2>Site Count</h2><p>"+siteCount+"</p>"; 
		siteContainer.appendChild(siteItem);
		document.body.appendChild(siteContainer);
	};
	sitesXML.send();
}

function switchSite() {
	if (curCurrentSite < siteCount - 1 && curUserCount == -curCurrentSite && curViewCount == -curCurrentSite && curWorkbookCount == -curCurrentSite && curDataCount == -curCurrentSite
		&& curTaskCount == -curCurrentSite){
		curCurrentSite++;
		try {
			countUsers();
			logoutCall = new XMLHttpRequest();
			logoutCall.open("GET",serverURL+"/auth/logout", true);
			logoutCall.onload = logIntoNextSite(sitesList[curCurrentSite].namespaceURL);
			logoutCall.send(null);
		}
		catch(err){
			console.log(err.message);
			console.log("Site number: "+ curCurrentSite);
			console.log(sitesList[curCurrentSite]);
		}
	} else if (curCurrentSite == siteCount - 1 && curUserCount == -curCurrentSite && curViewCount == -curCurrentSite && curWorkbookCount == -curCurrentSite && curDataCount == -curCurrentSite
				&& curTaskCount == -curCurrentSite) {
		console.log("FINISHED LOADING!!");
		countUsers();
		$('.ajax-loading').hide();
		document.getElementById("loadingMsg").hidden = true;
	}
}

function logIntoNextSite(siteNameSpace) {
	console.log("Logged out, moving to "+siteNameSpace);
	console.log(sitesList);
	document.getElementById("loadingMsg").innerHTML = "Getting " + sitesList[curCurrentSite].friendlyName;
	switchSiteLogin(siteNameSpace);
}

function getServerElements_noAPI() {
	getUsers_noAPI();
	getViews_noAPI();
	getWorkbooks_noAPI();
	getProjects_noAPI();
	getDataSources_noAPI();
	getTasks_noAPI();
}

function countUsers() {
	tableauDB.fetchRecords(0,"users", function(users) {
		document.getElementById("item user").innerHTML = "<h2>"+users.length+"</h2> users"
	});
}

function getUsers_noAPI() {
	console.log("Getting User List");
	var usersXML = new XMLHttpRequest();
	usersXML.open(
		"GET",
		fullURL+"/users.xml",
		true);
	usersXML.onload = function() {
		users = usersXML.responseXML.getElementsByTagName("user");
		curUserCount = users.length;
		currentUser = 0;
		for (var i = 0, user; user = users[i]; i++) {
			var userID = user.getElementsByTagName("id")[0].innerHTML;
			var name = user.getElementsByTagName("name")[0].innerHTML;
			var friendly_name = user.getElementsByTagName("friendly_name")[0].innerHTML;
			var email = user.getElementsByTagName("email")[0].innerHTML;
			var licensing_level = user.getElementsByTagName("licensing_level")[0].innerHTML;
			var administrator = user.getElementsByTagName("administrator")[0].innerHTML;
			var admin_type = user.getElementsByTagName("admin_type")[0].innerHTML;
			var publisher = user.getElementsByTagName("publisher")[0].innerHTML;
			var raw_data_suppressor = user.getElementsByTagName("raw_data_suppressor")[0].innerHTML;
			tableauDB.createUser(userID, name, friendly_name, email, licensing_level, administrator, admin_type, publisher, raw_data_suppressor, function() {
				console.log("User "+friendly_name+" saved!");
				currentUser++;
				if (currentUser == curUserCount) {
					console.log("All users saved!");
					getViews_noAPI();
				}
			});
		}	
	};
	usersXML.send();
}

function getViews_noAPI() {
	console.log("Getting Views");
	var viewsXML = new XMLHttpRequest();
	viewsXML.open(
		"GET",
		fullURL+"/views.xml",
		true);
	viewsXML.onload = function() {
		views = viewsXML.responseXML.getElementsByTagName("view");
		curViewCount = views.length;
		currentView = 0;
		for (var i = 0, view; view = views[i]; i++) {
			var viewID = view.getElementsByTagName("id")[0].innerHTML;
			var name = view.getElementsByTagName("name")[0].innerHTML;
			var title = view.getElementsByTagName("title")[0].innerHTML;
			var index = view.getElementsByTagName("index")[0].innerHTML;
			var repository_url = view.getElementsByTagName("repository-url")[0].innerHTML;
			var preview_url = view.getElementsByTagName("preview-url")[0].innerHTML;
			var updated_at = view.getElementsByTagName("updated-at")[0].innerHTML;
			var created_at = view.getElementsByTagName("created-at")[0].innerHTML;
			var ownerID = view.getElementsByTagName("owner")[0].getElementsByTagName("id")[0].innerHTML;
			var workbook_url = view.getElementsByTagName("workbook-url")[0].innerHTML;
			var customized_views = view.getElementsByTagName("customized-view");
			var customized_view_count = customized_views.length;
			tableauDB.createView(viewID, name, title, index, repository_url, preview_url, updated_at, created_at, ownerID, workbook_url, customized_view_count, function() {
				console.log("View "+name+" saved!");
				currentView++;
				if (currentView == curViewCount) {
					console.log("All views saved!");
					getWorkbooks_noAPI();
				}
			});
		}
	};
	viewsXML.send();
	
}

function getWorkbooks() { 
	var twbXML = new XMLHttpRequest();
	twbXML.open(
		"GET",
		fullURL+"/workbooks.xml",
		true);
	console.log("getWorkbooks: twbXML.onload going to readAuth()");
	twbXML.onload = function(){
		workbooks = twbXML.responseXML.getElementsByTagName("workbook");
		var twbContainer = document.createElement("div");
		twbContainer.setAttribute('id','twbContainer');
		for (var i = 0, twb; twb = workbooks[i]; i++) {
			var twbID = twb.getElementsByTagName("id")[0].innerHTML;
			var name = twb.getElementsByTagName("name")[0].innerHTML;
			var path = twb.getElementsByTagName("path")[0].innerHTML;
			var ownerID = twb.getElementsByTagName("owner")[0].getElementsByTagName("id")[0].innerHTML;
			var projectID = twb.getElementsByTagName("project")[0].getElementsByTagName("id")[0].innerHTML;
			var updatedat = twb.getElementsByTagName("updated-at")[0].innerHTML;
			var createdat = twb.getElementsByTagName("created-at")[0].innerHTML;
			var repositoryurl = twb.getElementsByTagName("repository-url")[0].innerHTML;
			tableauDB.createTwb(twbID,name,path,ownerID,projectID,updatedat,createdat,repositoryurl, function() {
				console.log("Workbook "+ name+" saved!");
			});
			var twbItem = document.createElement("div");
			twbItem.setAttribute('class','item');
			twbItem.setAttribute('id','item');
			twbItem.innerHTML = name; 
			twbItem.setAttribute('workbookRep',repositoryurl);
			twbItem.setAttribute('workbookID',twbID);
			twbContainer.appendChild(twbItem);
		}
		document.body.appendChild(twbContainer);
function initiliseStatsTiles() {
		var statsContainer = document.createElement("div");
		statsContainer.setAttribute('id','statsContainer');
		document.body.appendChild(statsContainer);
		var container = document.querySelector('#statsContainer');
		var iso = new Isotope( container );
		iso.arrange({
			// options
			itemSelector: '.item',
			layoutMode: 'cellsByRow',
			cellsByRow: {
				containerStyle: null,
				columnWidth: 210,
				rowHeight: 60
			}
		});
		iso.on('layoutComplete', function(){
			document.querySelector('#statsContainer').style = 'static';
			console.log("Stats Tile Layout Done!");
		});
}

/* document.body.appendChild(twbContainer);
		for (var i = 0, twb; twb = workbooks[i]; i++) {
			var isoItem = document.getElementsByClassName('item')[i];
			isoItem.addEventListener('click', function(e){
				iso.arrange({
					// options
					itemSelector: '.item',
					layoutMode: 'vertical'
					});
				this.className = 'selectedItem';
				var workbookRep = this.getAttribute('workbookRep');
				var workbookID = this.getAttribute('workbookID');
				getUsersGroups(workbookID,workbookRep, function(){
					buildPermissionsArray(workbookID,workbookRep);
				});
				iso.on('layoutComplete', function(){
					document.querySelector('#twbContainer').style = 'static';
					console.log("Clicked Workbook Layout Done!");
				});
				});	
		}
		var container = document.querySelector('#twbContainer');
		var iso = new Isotope( container );
		iso.arrange({
		  // options
		  itemSelector: '.item',
		  layoutMode: 'cellsByRow',
		  cellsByRow: {
			containerStyle: null,
			columnWidth: 210,
			rowHeight: 60
		  }
		});
		iso.on('layoutComplete', function(){
			document.querySelector('#twbContainer').style = 'static';
			console.log("Workbook Layout Done!");
		});
	};
	twbXML.send(null);
};
		}); */

function listUsers(){
	var userContainer = document.createElement("div");
	userContainer.setAttribute('id','userContainer');
	//List Owner 
	tableauDB.fetchWorkbooks(workbookID, function(workbook) {
		var OwnerTitle = document.createElement("div");
		OwnerTitle.setAttribute('class','ownerTitle');
		OwnerTitle.setAttribute('id','ownerTitle');
		OwnerTitle.innerHTML = "owner >";
		userContainer.appendChild(OwnerTitle); 
		console.log(workbook[0]);
		var ownerID = workbook[0].ownerID;
		tableauDB.fetchUsers(ownerID, function(user) {	
			var twbOwner = document.createElement("div");
			twbOwner.setAttribute('class','users');
			twbOwner.setAttribute('id','users');
			console.log(user[0]);
			console.log(user[0].friendlyName);
			twbOwner.innerHTML = user[0].friendlyName; 
			userContainer.appendChild(twbOwner);
			fetchSiteAdmins(userContainer, ownerID);
		});
	});

};