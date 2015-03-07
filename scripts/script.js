var apiToken = "";
var apiLevel = 0;
var siteCount = 0;
var userCount = 0;
var viewCount = 0;
var workbookCount = 0;
var projCount = 0;
var dataCount = 0;
var taskCount = 0;
var subscriptionCount = 0;
var curUserCount = 0;
var curViewCount = 0;
var curWorkbookCount = 0;
var curProjCount = 0;
var curDataCount = 0;
var curTaskCount = 0;
var curSubscriptionCount = 0;
var curCurrentSite = 0;
var sitesList = [];

function checkAPIAccess() {
	$('.ajax-loading').show();
	console.log("Check API Access");
	var loginXML = '<tsRequest><credentials name="'+ document.querySelector('#username').value + '" password="'+document.querySelector('#password').value+
					'" ><site contentUrl="" /></credentials></tsRequest>';
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
			getSites_noAPI();
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
	document.getElementById("loadingMsg").innerHTML = "Getting List of Sites";
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
						initiliseStatsTiles();
						document.getElementById("loadingMsg").innerHTML = "Getting Default Site";
						getServerElements_noAPI();
					});
				}
			});
		}
	};
	sitesXML.send();
}

function switchSite() {
	if (curCurrentSite < siteCount - 1 && curUserCount == -curCurrentSite && curViewCount == -curCurrentSite && curWorkbookCount == -curCurrentSite && curDataCount == -curCurrentSite
		&& curTaskCount == -curCurrentSite && curSubscriptionCount == -curCurrentSite){
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
				&& curTaskCount == -curCurrentSite  && curSubscriptionCount == -curCurrentSite) {
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
	getSubscriptions_noAPI();
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
			var name = user.getElementsByTagName("name")[0].innerHTML;
			var friendly_name = user.getElementsByTagName("friendly_name")[0].innerHTML;
			var email = user.getElementsByTagName("email")[0].innerHTML;
			var licensing_level = user.getElementsByTagName("licensing_level")[0].innerHTML;
			var administrator = user.getElementsByTagName("administrator")[0].innerHTML;
			var admin_type = user.getElementsByTagName("admin_type")[0].innerHTML;
			var publisher = user.getElementsByTagName("publisher")[0].innerHTML;
			var raw_data_suppressor = user.getElementsByTagName("raw_data_suppressor")[0].innerHTML;
			tableauDB.createUser(name, friendly_name, email, licensing_level, administrator, admin_type, publisher, raw_data_suppressor, function() {
				console.log("User "+friendly_name+" saved!");
				currentUser++;
				if (currentUser == curUserCount) {
					console.log("All users saved!");
					curUserCount = -curCurrentSite;
					switchSite();
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
		viewCount = viewCount + curViewCount;
		currentView = 0;
		if (views.length == 0) {
			curViewCount = -curCurrentSite;
			switchSite();
		}
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
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createView(viewID, name, title, index, repository_url, preview_url, updated_at, created_at, ownerID, workbook_url, customized_view_count, siteID, function() {
				console.log("View "+name+" saved!");
				currentView++;
				if (currentView == curViewCount) {
					console.log("All views saved!");
					document.getElementById("item view").innerHTML = "<h2>"+viewCount+"</h2> views"
					curViewCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	};
	viewsXML.send();
	
}

function getWorkbooks_noAPI() { 
	console.log("Getting workbooks")
	var workbookXML = new XMLHttpRequest();
	workbookXML.open(
		"GET",
		fullURL+"/workbooks.xml",
		true);
	workbookXML.onload = function(){
		workbooks = workbookXML.responseXML.getElementsByTagName("workbook");
		curWorkbookCount = workbooks.length;
		workbookCount = workbookCount + curWorkbookCount;
		currentWorkbook = 0;
		if (workbooks.length == 0) {
			curWorkbookCount = -curCurrentSite;
			switchSite();
		}
		for (var i = 0, workbook; workbook = workbooks[i]; i++) {
			var workbookID = workbook.getElementsByTagName("id")[0].innerHTML;
			var name = workbook.getElementsByTagName("name")[0].innerHTML;
			var size = workbook.getElementsByTagName("size")[0].innerHTML;
			var path = workbook.getElementsByTagName("path")[0].innerHTML;
			var ownerID = workbook.getElementsByTagName("owner")[0].getElementsByTagName("id")[0].innerHTML;
			var projectID = workbook.getElementsByTagName("project")[0].getElementsByTagName("id")[0].innerHTML;
			var tasks = workbook.getElementsByTagName("tasks");
			var tasks_count = tasks.length;
			var updated_at = workbook.getElementsByTagName("updated-at")[0].innerHTML;
			var created_at = workbook.getElementsByTagName("created-at")[0].innerHTML;
			var repository_url = workbook.getElementsByTagName("repository-url")[0].innerHTML;
			var tabs_allowed = workbook.getElementsByTagName("tabs_allowed")[0].innerHTML;
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createWorkbook(workbookID, name, size, path, ownerID, projectID , tasks_count, updated_at,created_at, repository_url, tabs_allowed,siteID, function() {
				console.log("Workbook "+ name+" saved!");
				currentWorkbook++;
				if (currentWorkbook == curWorkbookCount) {
					console.log("All workbooks saved!");
					document.getElementById("item workbook").innerHTML = "<h2>"+workbookCount+"</h2> workbooks"
					curWorkbookCount = -curCurrentSite;
					switchSite();
				}
			});
		}
		
	};
	workbookXML.send(null);
};

function getProjects_noAPI() {
	console.log("Getting Projects");
	var projectsXML = new XMLHttpRequest();
	projectsXML.open(
		"GET",
		fullURL+"/projects.xml",
		true);
	projectsXML.onload = function() {
		projects = projectsXML.responseXML.getElementsByTagName("project");
		curProjCount = projects.length;
		projCount = projCount + curProjCount;
		currentProj = 0;
		for (var i = 0, view; view = projects[i]; i++) {
			var projID = view.getElementsByTagName("id")[0].innerHTML;
			var name = view.getElementsByTagName("name")[0].innerHTML;
			var updated_at = view.getElementsByTagName("updated-at")[0].innerHTML;
			var created_at = view.getElementsByTagName("created-at")[0].innerHTML;
			var ownerID = view.getElementsByTagName("owner")[0].getElementsByTagName("id")[0].innerHTML;
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createProject(projID, name, updated_at, created_at, ownerID, siteID, function() {
				console.log("Project "+name+" saved!");
				currentProj++;
				if (currentProj == curProjCount) {
					console.log("All projects saved!");
					document.getElementById("item project").innerHTML = "<h2>"+projCount+"</h2> projects";
					curProjCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	};
	projectsXML.send();
	
}

function getDataSources_noAPI() {
	console.log("Getting Data Sources");
	var dataXML = new XMLHttpRequest();
	dataXML.open(
		"GET",
		fullURL+"/datasources.xml",
		true);
	dataXML.onload = function() {
		datasources = dataXML.responseXML.getElementsByTagName("datasource");
		curDataCount = datasources.length;
		dataCount = dataCount + curDataCount;
		currentData = 0;
		if (datasources.length == 0) {
			curDataCount = -curCurrentSite;
			switchSite();
		}
		for (var i = 0, dataS; dataS = datasources[i]; i++) {
			var dataID = dataS.getElementsByTagName("id")[0].innerHTML;
			var name = dataS.getElementsByTagName("name")[0].innerHTML;
			var repository_url = dataS.getElementsByTagName("repository-url")[0].innerHTML;
			var ownerID = dataS.getElementsByTagName("owner_id")[0].innerHTML;		
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createDataSource(dataID, name, repository_url, ownerID, siteID, function() {
				console.log("Data Source "+name+" saved!");
				currentData++;
				if (currentData == curDataCount) {
					console.log("All datasources saved!");
					document.getElementById("item datasource").innerHTML = "<h2>"+dataCount+"</h2> data sources";
					curDataCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	};
	dataXML.send();
	
}

function getTasks_noAPI() {
	console.log("Getting Tasks");
	var taskXML = new XMLHttpRequest();
	taskXML.open(
		"GET",
		fullURL+"/tasks.xml",
		true);
	taskXML.onload = function() {
		tasks = taskXML.responseXML.getElementsByTagName("task");
		curTaskCount = tasks.length;
		taskCount = taskCount + curTaskCount;
		currentTask = 0;
		if (tasks.length == 0) {
			curTaskCount = -curCurrentSite;
			switchSite();
		}
		for (var i = 0, task; task = tasks[i]; i++) {
			var taskID = task.getElementsByTagName("id")[0].innerHTML;
			var type = task.getElementsByTagName("type")[0].innerHTML;
			var priority = task.getElementsByTagName("priority")[0].innerHTML;
			var targetID = task.getElementsByTagName("object")[0].getElementsByTagName("id")[0].innerHTML;
			var targetName = task.getElementsByTagName("object")[0].getElementsByTagName("name")[0].innerHTML;
			var targetType = task.getElementsByTagName("object")[0].getElementsByTagName("type")[0].innerHTML;
			var scheduleID = task.getElementsByTagName("schedule")[0].getElementsByTagName("id")[0].innerHTML;
			var scheduleName = task.getElementsByTagName("schedule")[0].getElementsByTagName("name")[0].innerHTML;
			var schedulePriority = task.getElementsByTagName("schedule")[0].getElementsByTagName("priority")[0].innerHTML;
			var scheduleEnabled = task.getElementsByTagName("schedule")[0].getElementsByTagName("enabled")[0].innerHTML;
			var schedule_next_run = task.getElementsByTagName("schedule")[0].getElementsByTagName("run-next-at")[0].innerHTML;
			var schedule_updated_at = task.getElementsByTagName("schedule")[0].getElementsByTagName("updated-at")[0].innerHTML;	
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createTask(taskID, type, priority, targetID, targetName, targetType, scheduleID, scheduleName, schedulePriority,
								 scheduleEnabled, schedule_next_run, schedule_updated_at, siteID, function() {
				console.log("Task "+name+" saved!");
				currentTask++;
				if (currentTask == curTaskCount) {
					console.log("All tasks saved!");
					document.getElementById("item task").innerHTML = "<h2>"+taskCount+"</h2> tasks";
					curTaskCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	};
	taskXML.send();
	
}

function getSubscriptions_noAPI() {
	console.log("Getting subscriptions");
	var subscriptionXML = new XMLHttpRequest();
	subscriptionXML.open(
		"GET",
		fullURL+"/subscriptions.xml",
		true);
	subscriptionXML.onload = function() {
		subscriptions = subscriptionXML.responseXML.getElementsByTagName("subscription");
		curSubscriptionCount = subscriptions.length;
		subscriptionCount = subscriptionCount + curSubscriptionCount;
		currentSubscription = 0;
		if (subscriptions.length == 0) {
			curSubscriptionCount = -curCurrentSite;
			switchSite();
		}
		for (var i = 0, subscription; subscription = subscriptions[i]; i++) {
			var subscriptionID = subscription.getElementsByTagName("id")[0].innerHTML;
			var subject = subscription.getElementsByTagName("subject")[0].innerHTML;
			var userID = subscription.getElementsByTagName("user")[0].getElementsByTagName("id")[0].innerHTML;
			var userName = subscription.getElementsByTagName("user")[0].getElementsByTagName("name")[0].innerHTML;
			var userEmail = subscription.getElementsByTagName("user")[0].getElementsByTagName("email")[0].innerHTML;
			var scheduleID = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("id")[0].innerHTML;
			var scheduleName = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("name")[0].innerHTML;
			var schedulePriority = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("priority")[0].innerHTML;
			var scheduleEnabled = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("enabled")[0].innerHTML;
			var schedule_next_run = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("run-next-at")[0].innerHTML;
			var schedule_updated_at = subscription.getElementsByTagName("schedule")[0].getElementsByTagName("updated-at")[0].innerHTML;	
			var siteID = sitesList[curCurrentSite].siteID;
			tableauDB.createSubscription(subscriptionID, subject, userID, userName, userEmail, scheduleID, scheduleName, schedulePriority,
								 scheduleEnabled, schedule_next_run, schedule_updated_at, siteID, function() {
				console.log("Subscription "+name+" saved!");
				currentSubscription++;
				if (currentSubscription == curSubscriptionCount) {
					console.log("All subscriptions saved!");
					document.getElementById("item subscription").innerHTML = "<h2>"+subscriptionCount+"</h2> subscriptions";
					curSubscriptionCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	};
	subscriptionXML.send();
	
}

function initiliseStatsTiles() {
		var statsContainer = document.createElement("div");
		statsContainer.setAttribute('id','statsContainer');
		var siteCountDiv = document.createElement("div");
		siteCountDiv.setAttribute('class','item');
		siteCountDiv.setAttribute('id','item site');
		siteCountDiv.innerHTML = "<h2>"+siteCount+"</h2> sites"; 
		statsContainer.appendChild(siteCountDiv);
		var userCountDiv = document.createElement("div");
		userCountDiv.setAttribute('class','item');
		userCountDiv.setAttribute('id','item user');
		userCountDiv.innerHTML = "<h2>"+userCount+"</h2> users"; 
		statsContainer.appendChild(userCountDiv);
		var projectCountDiv = document.createElement("div");
		projectCountDiv.setAttribute('class','item');
		projectCountDiv.setAttribute('id','item project');
		projectCountDiv.innerHTML = "<h2>"+projCount+"</h2> projects";
		statsContainer.appendChild(projectCountDiv);
		var workbookCountDiv = document.createElement("div");
		workbookCountDiv.setAttribute('class','item');
		workbookCountDiv.setAttribute('id','item workbook');
		workbookCountDiv.innerHTML = "<h2>"+workbookCount+"</h2> workbooks"; 
		statsContainer.appendChild(workbookCountDiv);
		var viewCountDiv = document.createElement("div");
		viewCountDiv.setAttribute('class','item');
		viewCountDiv.setAttribute('id','item view');
		viewCountDiv.innerHTML = "<h2>"+viewCount+"</h2> views"; 
		statsContainer.appendChild(viewCountDiv);
		var dataCountDiv = document.createElement("div");
		dataCountDiv.setAttribute('class','item');
		dataCountDiv.setAttribute('id','item datasource');
		dataCountDiv.innerHTML = "<h2>"+dataCount+"</h2> data sources"; 
		statsContainer.appendChild(dataCountDiv);
		var taskCountDiv = document.createElement("div");
		taskCountDiv.setAttribute('class','item');
		taskCountDiv.setAttribute('id','item task');
		taskCountDiv.innerHTML = "<h2>"+taskCount+"</h2> tasks"; 
		statsContainer.appendChild(taskCountDiv);
		var subscriptionCountDiv = document.createElement("div");
		subscriptionCountDiv.setAttribute('class','item');
		subscriptionCountDiv.setAttribute('id','item subscription');
		subscriptionCountDiv.innerHTML = "<h2>"+subscriptionCount+"</h2> subscriptions"; 
		statsContainer.appendChild(subscriptionCountDiv);
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