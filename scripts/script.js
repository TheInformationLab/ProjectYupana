var workgroup_session_id = "", xsrf_token = "", currentSiteLuid = "", apiLevel = 0, siteCount = 0, userCount = 0, groupCount = 0, viewCount = 0, workbookCount = 0, projectCount = 0, dataPubCount = 0, dataEmbedCount = 0, taskCount = 0, subscriptionCount = 0, curUserCount = 0, curGroupCount = 0, curViewCount = 0, curWorkbookCount = 0, curProjectCount = 0, curPubDataCount = 0, curEmbedDataCount = 0, curTaskCount = 0, curSubscriptionCount = 0, curCurrentSite = 0, sitesList = [], currentSiteId = "", currentSiteName = "", currentSiteUrl = "";

	var gui = require('nw.gui');
	if (process.platform === "darwin") {
	  var mb = new gui.Menu({type: 'menubar'});
	  mb.createMacBuiltin('RoboPaint', {
	    hideEdit: false,
	  });
	  gui.Window.get().menu = mb;
	}

function initialiseYupana() {
	checkAPIAccess();
	document.body.className = "yay-hide";
	loadNavBar();
	initiliseStatsTiles();
	curCurrentSite = 0;
	$(".ajax-loading").hide();
	document.getElementById("loadingMsg").hidden = true;

	var portfinder = require('portfinder');
	portfinder.basePort = 8000;
	portfinder.getPort(function (err, port) {
		if (port == 8000){
			startWebServer(port);
		}
	});
	tableauDB.fetchRecords(0,"projects", function(projects) {
		if(projects.length == 0) {
			reIndexServer();
		} else {
			var tableArr = [
				{'name' : 'sites', 'div' : 'site', 'label' : 'sites'},
				{'name' : 'serverUsers', 'div' : 'user', 'label' : 'users'},
				{'name' : 'groups', 'div' : 'group', 'label' : 'groups'},
				{'name' : 'projects', 'div' : 'project', 'label' : 'projects'},
				{'name' : 'workbooks', 'div' : 'workbook', 'label' : 'workbooks'},
				{'name' : 'views', 'div' : 'view', 'label' : 'views'},
				{'name' : 'pubdatasources', 'div' : 'pubdatasource', 'label' : 'published data sources'},
				{'name' : 'embeddatasources', 'div' : 'embeddatasource', 'label' : 'workbook data sources'},
				{'name' : 'tasks', 'div' : 'task', 'label' : 'tasks'},
				{'name' : 'subscriptions', 'div' : 'subscription', 'label' : 'subscriptions'}
			];
			refreshCount(tableArr);
			loadFinalGui();
		}
	});
}

function checkAPIAccess() {
	$('.ajax-loading').show();
	//console.log("Check API Access");

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/api/2.1/sites/"+currentSiteLuid+"/projects",
	  "method": "GET",
	  "headers": {
	    "X-Tableau-Auth": workgroup_session_id
	  }
	}

	$.ajax(settings).done(function (response, textStatus, jqXHR) {
	  //console.log(response);
		if (jqXHR.status == "404") {
			apiLevel = 0;
			//console.log("API Not Enabled");
		} else {
			//console.log("REST API Available");
			apiLevel = 1;
		}
	});
}

function reIndexServer() {
	//deleteDB('tableau');
	$('#reIndex').hide();
	$(".ajax-loading").show();
	document.getElementById("loadingMsg").hidden = false;
	document.body.className = 'yay-hide';
	tableauDB.clearData(["projects","taskSchedules","sitestats","subscriptions","pubdatasources","tasks","embeddatasources","groups","siteUsers","serverUsers","views","subscriptionSchedules","sites","workbooks","viewThumbnails"]);
	$('.carousel').slick('unslick');
	$('.carousel').remove();
	$('#guiContainer').remove();
	getServerUsers_noAPI();
	getSites_noAPI();
}

function getSites_noAPI(){
	//console.log("Getting Site List");
	document.getElementById("loadingMsg").innerHTML = "Getting List of Sites";
	fullURL = serverURL;
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getSiteNamesAcrossAllPods",
	  "method": "POST",
		"headers" : {
			"X-XSRF-TOKEN" : xsrf_token
		},
	  "data": "{\"method\":\"getSiteNamesAcrossAllPods\",\"params\":{\"page\":{\"startIndex\":0,\"maxItems\":99999}}}"
	}

	$.ajax(settings).done(function (response) {
		var sites = response.result.siteNames;
		//console.log(sites);
		for (var i = 0; i < sites.length; i++){
			siteCount = sites.length;
			currentSite = 0;
			tableauDB.createSite(i, sites[i].name, sites[i].urlName, function() {
				currentSite++;
				if (currentSite == siteCount) {
					tableauDB.fetchRecords(0,"sites", function(sites) {
						sitesList = sites;
						document.getElementById("item site").innerHTML = "<div class='countValue'><h2>"+siteCount+"</h2></div><div class='countTitle'>sites</div>";
						$("#loadingMsg").html("Reading " + sitesList[0].name);
						switchSiteLogin(sitesList[0].urlName);
					});
				}
			});
		}
	});
}

function switchSite() {
	if (curCurrentSite < siteCount - 1 && curUserCount == -curCurrentSite && curGroupCount == -curCurrentSite && curViewCount == -curCurrentSite && curWorkbookCount == -curCurrentSite && curPubDataCount == -curCurrentSite && curEmbedDataCount == -curCurrentSite && curProjectCount == -curCurrentSite && curTaskCount == -curCurrentSite && curSubscriptionCount == -curCurrentSite){
			curCurrentSite++;
			$("#loadingMsg").html("Reading " + sitesList[curCurrentSite].name);
			switchSiteLogin(sitesList[curCurrentSite].urlName);
	} else if (curCurrentSite == siteCount - 1 && curUserCount == -curCurrentSite && curGroupCount == -curCurrentSite && curViewCount == -curCurrentSite && curWorkbookCount == -curCurrentSite && curPubDataCount == -curCurrentSite && curEmbedDataCount == -curCurrentSite && curProjectCount == -curCurrentSite && curTaskCount == -curCurrentSite && curSubscriptionCount == -curCurrentSite) {
		//console.log("FINISHED LOADING!!");
		refreshCount([{'name' : 'serverUsers', 'div' : 'user', 'label' : 'users'}]);
		refreshCount([{'name' : 'sites', 'div' : 'site', 'label' : 'sites'}]);
		loadFinalGui();
		$('.ajax-loading').hide();
		/*document.getElementById("loadingMsg").hidden = true;
		startWebServer();
		startRESTAPI();*/
	}
}

function updateSiteInfo(site) {
	tableauDB.updateSite(curCurrentSite, site, function(site){
		currentSiteLuid = site.luid;
		currentSiteId = site.id;
		currentSiteName = site.name;
		getServerElements_noAPI();
	});
}

function getServerElements_noAPI() {
	getSiteUsers_noAPI();
	getGroups_noAPI();
	getViews_noAPI()
	getWorkbooks_noAPI();
	getPubDataSources_noAPI();
	getEmbedDataSources_noAPI();
	getProjects_noAPI();
	getExtractTasks_noAPI();
	getSubscriptions_noAPI();
}

function refreshCount(tableArr) {
	if (tableArr.length > 0) {
		for (var i=0; i < tableArr.length;i++) {
			tableauDB.numberofRecords(tableArr[i].name, tableArr[i], function(recordCount, table) {
				//console.log(table);
				document.getElementById("item "+table.div).innerHTML = "<div class='countValue'><h2>"+recordCount+"</h2></div><div class='countTitle'>"+table.label+"</div>"
			});
		}
	}
}

function getServerUsers_noAPI() {
	//console.log("Getting User List");

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getServerUsers",
	  "method": "POST",
		"headers" : {
			"X-XSRF-TOKEN" : xsrf_token
		},
		"data": "{\"method\":\"getServerUsers\",\"params\":{\"order\":[{\"field\":\"displayName\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":99999999}}}"
	}

	$.ajax(settings).done(function (response) {
		serverUsers = response.result.users;
		curServerUserCount = serverUsers.length;
		currentServerUser = 0;
		for (var i = 0, user; user = serverUsers[i]; i++) {
			tableauDB.createServerUser(user, function() {
				currentServerUser++;
				if (currentServerUser == curServerUserCount) {
					//console.log("All users saved!");
					refreshCount([{'name' : 'serverUsers', 'div' : 'user', 'label' : 'users'}]);
				}
			});
		}
	}).error(function(httpObj, textStatus) {
      if(httpObj.status!=200) {
				gui.Window.reload();
			}
	});
}

function getSiteUsers_noAPI() {
	//console.log("Getting User List");

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getSiteUsers",
	  "method": "POST",
		"headers" : {
			"X-XSRF-TOKEN" : xsrf_token
		},
		"data": "{\"method\":\"getSiteUsers\",\"params\":{\"order\":[{\"field\":\"displayName\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":99999999}}}"
	}

	$.ajax(settings).done(function (response) {
		users = response.result.users;
		curUserCount = users.length;
		currentUser = 0;
		for (var i = 0, user; user = users[i]; i++) {
			user.siteId = currentSiteId;
			tableauDB.createSiteUser(user, function() {
				currentUser++;
				if (currentUser == curUserCount) {
					//console.log("All users saved!");
					curUserCount = -curCurrentSite;
					switchSite();
				}
			});
		}
	});
}

function getGroups_noAPI() {
	//console.log("Getting groups");
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getGroups",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
	  "data": "{\"method\":\"getGroups\",\"params\":{\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":99999}}}"
	}

	$.ajax(settings).done(function (response) {
		groups = response.result.groups;
		curGroupCount = groups.length;
		groupCount = groupCount + curGroupCount;
		currentGroup = 0;
		tableauDB.createSiteStat(currentSiteId, currentSiteName, "groups", curGroupCount, function(site){
			//console.log("Group count for " + site.friendlyName + " saved");
		});
		if (curGroupCount == 0) {
			curGroupCount = -curCurrentSite;
			switchSite();
		} else {
			for (var i = 0, group; group = groups[i]; i++) {
				tableauDB.createGroup(group, currentSiteId, function() {
					//console.log("Group "+name+" saved!");
					currentGroup++;
					if (currentGroup == curGroupCount) {
						//console.log("All groups saved!");
						document.getElementById("item group").innerHTML = "<div class='countValue'><h2>"+groupCount+"</h2></div><div class='countTitle'>groups</div>";
						curGroupCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		}
	});
}

function base64Encode(str) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
}

function getImage(url, callback) {
	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": url,
	  "method": "GET",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
		"mimeType": "text/plain; charset=x-user-defined"
	}
	$.ajax(settings).done(function (response) {
	  callback('data:image/png;base64,' + base64Encode(response));
	});
}

function getViews_noAPI() {
	//console.log("Getting Views");

	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/getViews",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
		"data": "{\"method\":\"getViews\",\"params\":{\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":999999},\"statFields\":[\"hitsTotal\",\"hitsLastOneMonthTotal\",\"hitsLastThreeMonthsTotal\",\"hitsLastTwelveMonthsTotal\",\"favoritesTotal\"]}}"
}

	$.ajax(settings).done(function (response) {
		var views = response.result.views;
		if (views) {
			curViewCount = views.length;
			viewCount = viewCount + curViewCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "views", curViewCount, function(site){
				//console.log("View count for " + site.friendlyName + " saved");
			});
			currentView = 0;
			for (var i = 0; i < curViewCount; i++){
				var view = views[i];

				if (view.usageInfo) {
					var viewUsage = view.usageInfo;
				} else {
					var viewUsage = {};
				}

				var settings = {
				  "async": true,
				  "crossDomain": true,
				  "url": serverURL + "/vizportal/api/web/v1/getView",
				  "method": "POST",
				  "headers": {
				    "x-xsrf-token": xsrf_token
				  },
				  "data": "{\"method\":\"getView\",\"params\":{\"id\":\""+view.id+"\"}}"
				}

				$.ajax(settings).done(function (response) {
					var v  = response.result;
					v.usageInfo = viewUsage;
					v.siteName = currentSiteName;
					v.siteLuid = currentSiteLuid;
					v.siteUrl = sitesList[curCurrentSite].urlName;
					if (viewUsage.hitsLastOneMonthTotal > 1 || v.favorite) {
						var imgSrc = serverURL + "/" + v.thumbnailUrl;
						getImage(imgSrc, function(image) {
							tableauDB.storeViewThumbnail(v.id, v.name, v.path, currentSiteUrl, viewUsage, image, function (viewImg) {
								//console.log(viewImg);
							});
						});
					}
					tableauDB.createView(v, currentSiteId, function() {
						//console.log("View "+name+" saved!");
						currentView++;
						if (currentView == curViewCount) {
							//console.log("All views saved!");
							document.getElementById("item view").innerHTML = "<div class='countValue'><h2>"+viewCount+"</h2></div><div class='countTitle'>views</div>"
							curViewCount = -curCurrentSite;
							switchSite();
						}
					});
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "views", 0, function(site){
				//console.log("View count for " + site.friendlyName + " saved");
			});
			curViewCount = -curCurrentSite;
			switchSite();
		}
	});
}

function getWorkbooks_noAPI() {
	//console.log("Getting Workbooks");

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/getWorkbooks",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
		"data": "{\"method\":\"getWorkbooks\",\"params\":{\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":999999},\"statFields\":[\"hitsTotal\",\"hitsLastOneMonthTotal\",\"hitsLastThreeMonthsTotal\",\"hitsLastTwelveMonthsTotal\",\"favoritesTotal\"]}}"
}

	$.ajax(settings).done(function (response) {
		var workbooks = response.result.workbooks;
		if (workbooks) {
			curWorkbookCount = workbooks.length;
			workbookCount = workbookCount + curWorkbookCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "workbooks", curWorkbookCount, function(site){
				//console.log("Workbook count for " + site.friendlyName + " saved");
			});
			currentWorkbook = 0;
			for (var i = 0; i < curWorkbookCount; i++){
				var workbook = workbooks[i];

				if (workbook.usageInfo) {
					var workbookUsage = workbook.usageInfo;
				} else {
					var workbookUsage = {};
				}
				var w  = workbook;
				tableauDB.createWorkbook(w, currentSiteId, function() {
					//console.log("Workbook "+name+" saved!");
					currentWorkbook++;
					if (currentWorkbook == curWorkbookCount) {
						//console.log("All workbookes saved!");
						document.getElementById("item workbook").innerHTML = "<div class='countValue'><h2>"+workbookCount+"</h2></div><div class='countTitle'>workbooks</div>"
						curWorkbookCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "workbooks", 0, function(site){
				//console.log("Workbook count for " + site.friendlyName + " saved");
			});
			curWorkbookCount = -curCurrentSite;
			switchSite();
		}
	});
}


function getPubDataSources_noAPI() {
	//console.log("Getting Published Datasources");

	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/getDatasources",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
		"data": "{\"method\":\"getDatasources\",\"params\":{\"filter\":{\"operator\":\"and\",\"clauses\":[{\"operator\":\"eq\",\"field\":\"isPublished\",\"value\":true}]},\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":9999999}}}"
}

	$.ajax(settings).done(function (response) {
		var datasources = response.result.datasources;
		if (datasources) {
			curPubDataCount = datasources.length;
			dataPubCount = dataPubCount + curPubDataCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "published datasources", curPubDataCount, function(site){
				//console.log("Published Data Source count for " + currentSiteName + " saved");
			});
			currentPubDataSource = 0;
			for (var i = 0; i < curPubDataCount; i++){
				var datasource = datasources[i];

				var settings = {
				  "async": true,
				  "crossDomain": true,
				  "url": serverURL + "/vizportal/api/web/v1/getDatasource",
				  "method": "POST",
				  "headers": {
				    "x-xsrf-token": xsrf_token
				  },
				  "data": "{\"method\":\"getDatasource\",\"params\":{\"id\":\""+datasource.id+"\"}}"
				}

				$.ajax(settings).done(function (response) {
					var ds  = response.result;
					tableauDB.createPubDataSource(ds, currentSiteId, function() {
						//console.log("Published data source "+ds.name+" saved!");
						currentPubDataSource++;
						if (currentPubDataSource == curPubDataCount) {
							//console.log("All published data sources saved!");
							document.getElementById("item pubdatasource").innerHTML = "<div class='countValue'><h2>"+dataPubCount+"</h2></div><div class='countTitle'>published data sources</div>"
							curPubDataCount = -curCurrentSite;
							switchSite();
						}
					});
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "published datasources", 0, function(site){
				//console.log("Data source count for " + currentSiteName + " saved");
			});
			curPubDataCount = -curCurrentSite;
			switchSite();
		}
	});
}

function getEmbedDataSources_noAPI() {
	//console.log("Getting Embedded Datasources");

	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/getDatasources",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
		"data": "{\"method\":\"getDatasources\",\"params\":{\"filter\":{\"operator\":\"and\",\"clauses\":[{\"operator\":\"eq\",\"field\":\"isPublished\",\"value\":false}]},\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":9999999}}}"
}

	$.ajax(settings).done(function (response) {
		var embeddatasources = response.result.datasources;
		if (embeddatasources) {
			curEmbedDataCount = embeddatasources.length;
			dataEmbedCount = dataEmbedCount + curEmbedDataCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "embedded datasources", curEmbedDataCount, function(site){
				//console.log("Embedded data source count for " + currentSiteName + " saved");
			});
			currentEmbedDataSource = 0;
			for (var i = 0; i < curEmbedDataCount; i++){
				var ds = embeddatasources[i];
				tableauDB.createEmbedDataSource(ds, currentSiteId, function() {
					//console.log("Embedded data source "+ds.name+" saved!");
					currentEmbedDataSource++;
					if (currentEmbedDataSource == curEmbedDataCount) {
						//console.log("All embedded data sources saved!");
						document.getElementById("item embeddatasource").innerHTML = "<div class='countValue'><h2>"+dataEmbedCount+"</h2></div><div class='countTitle'>embedded data sources</div>"
						curEmbedDataCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "embedded datasources", 0, function(site){
				//console.log("Embedded data source count for " + currentSiteName + " saved");
			});
			curEmbedDataCount = -curCurrentSite;
			switchSite();
		}
	});
}

function getProjects_noAPI() {
	//console.log("Getting Projects");

	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": serverURL+"/vizportal/api/web/v1/getProjects",
	  "method": "POST",
	  "headers": {
	    "x-xsrf-token": xsrf_token
	  },
	  "data": "{\"method\":\"getProjects\",\"params\":{\"order\":[{\"field\":\"name\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":999999}}}"
	}

	$.ajax(settings).done(function (response) {
		var projects = response.result.projects;
		if (projects) {
			curProjectCount = projects.length;
			projectCount = projectCount + curProjectCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "projects", curProjectCount, function(site){
				//console.log("Project count for " + currentSiteName + " saved");
			});
			currentProject = 0;
			for (var i = 0; i < curProjectCount; i++){
				var prj = projects[i];
				tableauDB.createProject(prj, currentSiteId, function() {
					//console.log("Project "+prj.name+" saved!");
					currentProject++;
					if (currentProject == curProjectCount) {
						//console.log("All projects saved!");
						document.getElementById("item project").innerHTML = "<div class='countValue'><h2>"+projectCount+"</h2></div><div class='countTitle'>projects</div>"
						curProjectCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "projects", 0, function(site){
				//console.log("Project count for " + currentSiteName + " saved");
			});
			curProjectCount = -curCurrentSite;
			switchSite();
		}
	});
}

function getExtractTasks_noAPI() {
	//console.log("Getting Extract Refreshes");
	var settings = {
  "async": false,
  "crossDomain": true,
  "url": serverURL + "/vizportal/api/web/v1/getExtractTasks",
  "method": "POST",
  "headers": {
		"accept": "application/json, text/plain, */*",
    //"origin": serverURL,
    "x-xsrf-token": xsrf_token,
    //"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36",
    "content-type": "application/json;charset=UTF-8",
    //"referer": serverURL + "/",
    //"accept-encoding": "gzip, deflate",
    "accept-language": "en-US,en;q=0.8"
  },
  "data": "{\"method\":\"getExtractTasks\",\"params\":{\"filter\":{\"operator\":\"and\",\"clauses\":[{\"operator\":\"eq\",\"field\":\"siteId\",\"value\":\""+currentSiteId+"\"}]},\"order\":[{\"field\":\"targetName\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":46}}}"
}
$.ajax(settings).done(function (response) {
		var tasks = response.result.tasks;
		var schedules = response.result.schedules;
		if (response.result.totalCount > 0) {
			curTaskCount = tasks.length;
			taskCount = taskCount + curTaskCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "tasks", curTaskCount, function(site){
				//console.log("Task count for " + currentSiteName + " saved");
			});
			currentTask = 0;

			for (var j = 0; j < schedules.length; j++) {
				tableauDB.createTaskSchedule(schedules[j], currentSiteId, function() {
					//console.log("Scheudle logged");
				})
			}
			for (var i = 0; i < curTaskCount; i++){
				var tsk = tasks[i];
				tableauDB.createTask(tsk, function() {
					//console.log("Task "+tsk.name+" saved!");
					currentTask++;
					if (currentTask == curTaskCount) {
						//console.log("All tasks saved!");
						document.getElementById("item task").innerHTML = "<div class='countValue'><h2>"+taskCount+"</h2></div><div class='countTitle'>tasks</div>"
						curTaskCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "tasks", 0, function(site){
				//console.log("Task count for " + currentSiteName + " saved");
			});
			curTaskCount = -curCurrentSite;
			switchSite();
		}
	});
}


function getSubscriptions_noAPI() {
	//console.log("Getting Subscriptions");
	var settings = {
	  "async": false,
	  "crossDomain": true,
	  "url": serverURL + "/vizportal/api/web/v1/getSubscriptions",
	  "method": "POST",
	  "headers": {
	    "accept": "application/json, text/plain, */*",
	    "x-xsrf-token": xsrf_token,
	    "content-type": "application/json;charset=UTF-8",
	    "accept-language": "en-US,en;q=0.8"
	  },
	  "data": "{\"method\":\"getSubscriptions\",\"params\":{\"filter\":{\"operator\":\"and\",\"clauses\":[{\"operator\":\"eq\",\"field\":\"siteId\",\"value\":\""+currentSiteId+"\"}]},\"order\":[{\"field\":\"subject\",\"ascending\":true}],\"page\":{\"startIndex\":0,\"maxItems\":46}}}"
	}

	$.ajax(settings).done(function (response) {
		var subscriptions = response.result.subscriptions;
		var schedules = response.result.schedules;
		if (response.result.totalCount > 0) {
			curSubscriptionCount = subscriptions.length;
			subscriptionCount = subscriptionCount + curSubscriptionCount;
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "subscriptions", curSubscriptionCount, function(site){
				//console.log("Subscription count for " + currentSiteName + " saved");
			});
			currentSubscription = 0;

			for (var j = 0; j < schedules.length; j++) {
				tableauDB.createSubscriptionSchedule(schedules[j], currentSiteId, function() {
					//console.log("Scheudle logged");
				})
			}
			for (var i = 0; i < curSubscriptionCount; i++){
				var sub = subscriptions[i];
				tableauDB.createSubscription(sub, function() {
					//console.log("Subscription "+sub.name+" saved!");
					currentSubscription++;
					if (currentSubscription == curSubscriptionCount) {
						//console.log("All subscriptions saved!");
						document.getElementById("item subscription").innerHTML = "<div class='countValue'><h2>"+subscriptionCount+"</h2></div><div class='countTitle'>subscriptions</div>"
						curSubscriptionCount = -curCurrentSite;
						switchSite();
					}
				});
			}
		} else {
			tableauDB.createSiteStat(currentSiteId, currentSiteName, "subscriptions", 0, function(site){
				//console.log("Subscription count for " + currentSiteName + " saved");
			});
			curSubscriptionCount = -curCurrentSite;
			switchSite();
		}
	});
}

function initiliseStatsTiles() {
		var newlinetag = document.createElement("br");
		var contentWrapper = document.createElement('div');
		contentWrapper.setAttribute('class','content-wrap');
		var statsContainer = document.createElement("div");
		statsContainer.setAttribute('id','statsContainer');
		var siteCountDiv = document.createElement("div");
		siteCountDiv.setAttribute('class','item');
		siteCountDiv.setAttribute('id','item site');
		siteCountDiv.innerHTML = "<div class='countValue'><h2>"+siteCount+"</h2></div><div class='countTitle'>sites</div>";
		statsContainer.appendChild(siteCountDiv);
		var userCountDiv = document.createElement("div");
		userCountDiv.setAttribute('class','item');
		userCountDiv.setAttribute('id','item user');
		userCountDiv.innerHTML = "<div class='countValue'><h2>"+userCount+"</h2></div><div class='countTitle'>users</div>";
		statsContainer.appendChild(userCountDiv);
		var groupCountDiv = document.createElement("div");
		groupCountDiv.setAttribute('class','item');
		groupCountDiv.setAttribute('id','item group');
		groupCountDiv.innerHTML = "<div class='countValue'><h2>"+groupCount+"</h2></div><div class='countTitle'>groups</div>";
		statsContainer.appendChild(groupCountDiv);
		var projectCountDiv = document.createElement("div");
		projectCountDiv.setAttribute('class','item');
		projectCountDiv.setAttribute('id','item project');
		projectCountDiv.innerHTML = "<div class='countValue'><h2>"+projectCount+"</h2></div><div class='countTitle'>projects</div>";
		statsContainer.appendChild(projectCountDiv);
		var workbookCountDiv = document.createElement("div");
		workbookCountDiv.setAttribute('class','item');
		workbookCountDiv.setAttribute('id','item workbook');
		workbookCountDiv.innerHTML = "<div class='countValue'><h2>"+workbookCount+"</h2></div><div class='countTitle'>workbooks</div>";
		workbookCountDiv.appendChild(newlinetag);
		statsContainer.appendChild(workbookCountDiv);
		var viewCountDiv = document.createElement("div");
		viewCountDiv.setAttribute('class','item');
		viewCountDiv.setAttribute('id','item view');
		viewCountDiv.innerHTML = "<div class='countValue'><h2>"+viewCount+"</h2></div><div class='countTitle'>views</div>";
		statsContainer.appendChild(viewCountDiv);
		var dataCountDiv = document.createElement("div");
		dataCountDiv.setAttribute('class','item');
		dataCountDiv.setAttribute('id','item pubdatasource');
		dataCountDiv.innerHTML = "<div class='countValue'><h2>"+dataPubCount+"</h2></div><div class='countTitle'>published data sources</div>";
		statsContainer.appendChild(dataCountDiv);
		var dataCountDiv = document.createElement("div");
		dataCountDiv.setAttribute('class','item');
		dataCountDiv.setAttribute('id','item embeddatasource');
		dataCountDiv.innerHTML = "<div class='countValue'><h2>"+dataEmbedCount+"</h2></div><div class='countTitle'>workbook data sources</div>";
		statsContainer.appendChild(dataCountDiv);
		var taskCountDiv = document.createElement("div");
		taskCountDiv.setAttribute('class','item');
		taskCountDiv.setAttribute('id','item task');
		taskCountDiv.innerHTML = "<div class='countValue'><h2>"+taskCount+"</h2></div><div class='countTitle'>tasks</div>";
		statsContainer.appendChild(taskCountDiv);
		var subscriptionCountDiv = document.createElement("div");
		subscriptionCountDiv.setAttribute('class','item');
		subscriptionCountDiv.setAttribute('id','item subscription');
		subscriptionCountDiv.innerHTML = "<div class='countValue'><h2>"+subscriptionCount+"</h2></div><div class='countTitle'>subscriptions</div>";
		statsContainer.appendChild(subscriptionCountDiv);
		contentWrapper.appendChild(statsContainer);
		document.body.appendChild(contentWrapper);
		loadIndexModal();
		loadEmailModal();
		//var container = document.querySelector('#statsContainer');
		var iso = new Isotope( statsContainer );
		iso.arrange({
			// options
			itemSelector: '.item',
			layoutMode: 'masonry',
			masonry: {
				columnWidth: 210,
				gutter: 10,
				isFitWidth: true
			}
		});
		iso.on('layoutComplete', function(){
			//document.querySelector('#statsContainer').style = 'static';
			//console.log("Stats Tile Layout Done!");
		});
		/*
		workbookCountDiv.addEventListener('click', function(e){
			if (this.className == 'chartTile') {
				$("#workbookChart").remove();
				this.className = 'item';
				var container = document.querySelector('#statsContainer');
				var iso = new Isotope( container );
				iso.arrange({
					// options
					itemSelector: '.item',
					layoutMode: 'masonry',
						masonry: {
							columnWidth: 210,
							gutter: 10,
							isFitWidth: true
						}
				});
				iso.on('layoutComplete', function(){
					document.querySelector('#statsContainer').style = 'static';
					//console.log("Stats Tile Layout Done!");
				});
			} else {
				this.className = 'chartTile';
				tableauDB.fetchIndexRecords("workbooks", "sitestats", "table", function(stats) {
					var chartDiv = document.createElement("div");
					chartDiv.setAttribute('id','workbookChart');
					chartDiv.setAttribute('class','chart');
					workbookCountDiv.appendChild(chartDiv);
					drawChart(stats);
				});
			}
			//Fill with sites list
			//iso.layout();
		});
		*/
}

function loadFinalGui () {
	var guiContainer = document.createElement("div");
	guiContainer.setAttribute('id','guiContainer');
	var trendingDiv = document.createElement("div");
	trendingDiv.setAttribute('class','slider');
	trendingDiv.setAttribute('id','trending');
	var carouselDiv = document.createElement("div");
	carouselDiv.setAttribute('class','trendingCarousel');
	trendingDiv.appendChild(carouselDiv);
	guiContainer.appendChild(trendingDiv);
	$('.content-wrap').append(guiContainer);
	tableauDB.fetchIndexRange([1], [999999999999], "views", "trending", function(views) {
		if (views.length > 0) {
			var orderViews = views.reverse();
			var viewLength = orderViews.length;
			if (viewLength>20) {
				viewLength = 20;
			}
			var viewCount = 0;
			for (var i = 0; i < viewLength; i++) {
				var currentView = orderViews[i];
				tableauDB.fetchRecords(currentView.id, "viewThumbnails", function (image) {
					var thumbnailSpan = document.createElement("span");
					var thumbnailDiv = document.createElement("div");
					var thumbnailLink = document.createElement("a");
					var titleDiv = document.createElement("div");
					var thumbnailImg = document.createElement("img");
					if (image[0]) {
						thumbnailImg.setAttribute("src", image[0].image);
					}
					thumbnailSpan.setAttribute("class", "viewThumbnailSpan");
					thumbnailDiv.setAttribute("class", "viewThumbnailDiv");
					thumbnailDiv.appendChild(thumbnailImg);
					if (image[0]) {
						titleDiv.innerHTML = image[0].name + "<br/><i>" + image[0].viewUsage.hitsLastOneMonthTotal + " views</i>";
					}
					thumbnailSpan.appendChild(thumbnailDiv);
					thumbnailSpan.appendChild(titleDiv);

					thumbnailSpan.addEventListener('click', function() {
						var link = serverURL + "/#/site/" + image[0].siteUrl + "/views/" +image[0].path+"?:embed=y";
						if (currentSiteUrl != image[0].siteUrl) {
							switchSiteResource(image[0].siteUrl, function(response) {
								var win = gui.Window.open (link, {
					  			position: 'center',
					  			width: 901,
					  			height: 600,
									toolbar: false,
									title: "Project Yupana, SAML Login - The Information Lab"
								});
								win.on ('loaded', function(){

								});
							});
						} else {
							var win = gui.Window.open (link, {
								position: 'center',
								width: 901,
								height: 600,
								toolbar: false,
								title: "Project Yupana, SAML Login - The Information Lab"
							});
							win.on ('loaded', function(){

							});
						}

					});

					$('.trendingCarousel').append(thumbnailSpan);
					viewCount++;
					if(viewCount == viewLength) {
						$('.trendingCarousel').slick({
						  slidesToShow: 10,
						  slidesToScroll: 3,
							adaptiveHeight: true,
							variableWidth: true,
							draggable: true,
							arrows: false
						});
						$('#trending').append("<div class='countTitle'>what's trending</div>");
					}
		      //URL.revokeObjectURL(imgURL);
				});
				//carouselDiv.appendChild(thumbnailDiv);
			}
		} else {
			$('#trending').remove();
		}
	});

	var favDiv = document.createElement("div");
	favDiv.setAttribute('class','slider');
	favDiv.setAttribute('id','favorites');
	//trendingDiv.innerHTML = "<div class='slider'><div class='countTitle'>trending</div>";
	var favCarouselDiv = document.createElement("div");
	favCarouselDiv.setAttribute('class','favCarousel');
	favDiv.appendChild(favCarouselDiv);
	guiContainer.appendChild(favDiv);
	tableauDB.fetchIndexRange([1], [2], "views", "favorite", function(favViews) {
		if (favViews.length > 0) {
			var favViewTotal = favViews.length;
			var favViewCount = 0;
			for (var i = 0; i < favViewTotal; i++) {
				var currentView = favViews[i];
				tableauDB.fetchRecords(currentView.id, "viewThumbnails", function (favImage) {
					var thumbnailSpan = document.createElement("span");
					var thumbnailDiv = document.createElement("div");
					var thumbnailLink = document.createElement("a");
					var titleDiv = document.createElement("div");
					var thumbnailImg = document.createElement("img");
					if (favImage[0]) {
						thumbnailImg.setAttribute("src", favImage[0].image);
					}
					thumbnailSpan.setAttribute("class", "viewThumbnailSpan");
					thumbnailDiv.setAttribute("class", "viewThumbnailDiv");
					thumbnailDiv.appendChild(thumbnailImg);
					if (favImage[0]) {
						titleDiv.innerHTML = favImage[0].name;
					}
					thumbnailSpan.appendChild(thumbnailDiv);
					thumbnailSpan.appendChild(titleDiv);

					thumbnailSpan.addEventListener('click', function() {
						var link = serverURL + "/#/site/" + favImage[0].siteUrl + "/views/" +favImage[0].path+"?:embed=y";
						if (currentSiteUrl != favImage[0].siteUrl) {
							switchSiteResource(favImage[0].siteUrl, function(response) {
								var win = gui.Window.open (link, {
					  			position: 'center',
					  			width: 901,
					  			height: 600,
									toolbar: false,
									title: "Project Yupana, Redirecting - The Information Lab"
								});
								win.on ('loaded', function(){

								});
							});
						} else {
							var win = gui.Window.open (link, {
								position: 'center',
								width: 901,
								height: 600,
								toolbar: false,
								title: "Project Yupana, Redirecting - The Information Lab"
							});
							win.on ('loaded', function(){

							});
						}

					});

					$('.favCarousel').append(thumbnailSpan);
					favViewCount++;
					if(favViewCount == favViewTotal) {
						$('.favCarousel').slick({
						  slidesToShow: 10,
						  slidesToScroll: 3,
							adaptiveHeight: true,
							variableWidth: true,
							draggable: true,
							arrows: false
						});
						$('#favorites').append("<div class='countTitle'>your favorites</div>");
					}
		      //URL.revokeObjectURL(imgURL);
				});
				//carouselDiv.appendChild(thumbnailDiv);
			}
		} else {
			$('#favorites').remove();
		}
	});

	var iso = new Isotope( guiContainer );
	iso.arrange({
		// options
		itemSelector: '.slider',
		layoutMode: 'vertical'
	});
	iso.on('layoutComplete', function(){

	});
}

/*function drawChart(stats) {
	var ndx = crossfilter(stats);
	var siteDim = ndx.dimension(function(d) {return d.friendlyName});
	var countMeasure = siteDim.group().reduceSum(function(d) {return d.count});
	var statsbarchart = dc.rowChart(".chart");
	var width = document.getElementById('workbookChart').offsetWidth;
	statsbarchart
		.width(width).height(400)
		.margins({top: 0, left: 10, right: 10, bottom: 20})
		.dimension(siteDim)
		.group(countMeasure)
		.label(function (d) {
			return d.key;
		})
		.title(function (d) {
			return d.value;
		})
		.elasticX(true)
		.xAxis().ticks(8)
	statsbarchart.xAxis().tickFormat(d3.format("d"));
	statsbarchart.labelOffsetY(18);
	statsbarchart.ordering(function(d){return -d.value});
	dc.renderAll();
	var container = document.querySelector('#statsContainer');
	var iso = new Isotope( container );
	iso.arrange({
		// options
		itemSelector: '.item',
		layoutMode: 'masonry',
			masonry: {
				columnWidth: 210,
				gutter: 10,
				isFitWidth: true
			}
	});
	iso.on('layoutComplete', function(){
		document.querySelector('#statsContainer').style = 'static';
		//console.log("Stats Tile Layout Done!");
	});
}*/

function baseMenuBar() {
	var emailContainer = document.createElement("div");
	emailContainer.setAttribute('id','emailContainer');
	emailContainer.setAttribute('class','email');
	var exportImage = document.createElement("img");
	exportImage.setAttribute('id','exportImage');
	exportImage.setAttribute('class','exportImage');
	exportImage.setAttribute('src','export.png');
	var closeImage = document.createElement("img");
	closeImage.setAttribute('id','closeImage');
	closeImage.setAttribute('class','closeImage');
	closeImage.setAttribute('src','close.png');
	closeImage.hidden = true;
	emailContainer.appendChild(closeImage);
	emailContainer.appendChild(exportImage);
	document.body.appendChild(emailContainer);
	exportImage.addEventListener('click', function(e){
		exportImage.hidden = true;
		closeImage.hidden = false;
		emailContainer.className = 'expandEmailBox';
		showEmailForm();
		iso.layout();
	});
	closeImage.addEventListener('click', function(e){
		exportImage.hidden = false;
		closeImage.hidden = true;
		emailContainer.className = 'email';
		var name = document.querySelector('#nameInput');
		var toEmail = document.querySelector('#toInput');
		var fromEmail = document.querySelector('#emailInput');
		var formDiv = document.querySelector('#emailForm');
		formDiv.removeChild(name);
		formDiv.removeChild(toEmail);
		formDiv.removeChild(fromEmail);
		iso.layout();
	});
}

function sendData() {
	var fs = require('fs');
	var name = document.querySelector('#nameInput').value;
	var toEmail = document.querySelector('#toInput').value;
	var fromEmail = document.querySelector('#emailInput').value;
	tableauDB.fetchIndexRecords(null, "sitestats", "table", function(stats) {
		buildData(stats, function(datatoSend) {
			fs.writeFile("data/stats.csv", datatoSend, function(err) {
				if(err) {
					alert("Error writing results");
					//console.log(err);
				} else {
					var nodemailer = require('nodemailer');
					var transporter = nodemailer.createTransport({
						service: 'Mandrill',
						auth: {
							user: 'craig.bloodworth@theinformationlab.co.uk',
							pass: 'M5LQxB9S9KB4iy0iEiDC0w'
						}
					});
					transporter.sendMail({
						from: name+' <'+fromEmail+'>',
						to: toEmail,
						subject: 'Tableau Server Stats Feedback',
						text: 'Generated by The Information Lab',
						attachments: [ {path: 'data/stats.csv'} ]
					});
				}
			});
		});
	});
}

function buildData(stats, callback) {
	var datatoSend = "Site Name,Object,Count\r\n";
	for(var i=0, stat; stat = stats[i]; i++) {
		datatoSend = datatoSend + stat.friendlyName + "," + stat.table + "," + stat.count + "\r\n";
	}
	callback(datatoSend);
}

function loadNavBar () {
	var navbar = document.createElement("nav");
	navbar.setAttribute('class','navbar navbar-default navbar-fixed-top');
	var containerDiv = document.createElement("div");
	containerDiv.setAttribute('class','container-fluid');
	var toggleButton = document.createElement("button");
	toggleButton.setAttribute('class','btn btn-default navbar-btn yay-toggle');
	toggleButton.setAttribute('type', 'button');
	var togButtonIcon = document.createElement('i');
	togButtonIcon.setAttribute('class','fa fa-bars');
	toggleButton.appendChild(togButtonIcon);
	containerDiv.appendChild(toggleButton);
	var toggleLink = document.createElement('a');
	toggleLink.setAttribute('class','navbar-brand');
	toggleLink.setAttribute('href','#');
	containerDiv.appendChild(toggleLink);
	navbar.appendChild(containerDiv);
	document.body.appendChild(navbar);
	var yaybarDiv = document.createElement('div');
	yaybarDiv.setAttribute('class','yaybar yay-overlay');
	var nanoDiv = document.createElement('div');
	nanoDiv.setAttribute('class','nano');
	var nanoContent = document.createElement('div');
	nanoContent.setAttribute('class','nano-content');
	var menuList = document.createElement('ul');
	var menuTitle = document.createElement('li');
	menuTitle.setAttribute('class','label');
	menuTitle.innerHTML = "Yupana for Tableau Server";
	menuList.appendChild(menuTitle);
	var reindex = document.createElement('li');
	var reindexa = document.createElement('a');
	reindexa.setAttribute('href','#');
	reindexa.setAttribute('data-toggle','modal');
	reindexa.setAttribute('data-target','#reIndex');
	reindexa.innerHTML = "<i class='fa fa-envelope-o'></i> Reindex Server";
	reindex.appendChild(reindexa);
	menuList.appendChild(reindex);
	var exportEmail = document.createElement('li');
	var exportEmaila = document.createElement('a');
	exportEmaila.setAttribute('href','#');
	exportEmaila.setAttribute('data-toggle','modal');
	exportEmaila.setAttribute('data-target','#myModal');
	exportEmaila.innerHTML = "<i class='fa fa-envelope-o'></i> Email Stats";
	exportEmail.appendChild(exportEmaila);
	menuList.appendChild(exportEmail);
	var exportFile = document.createElement('li');
	var exportFilea = document.createElement('a');
	exportFilea.setAttribute('href','#');
	exportFilea.innerHTML = "<i class='fa fa-table'></i> Export Files";
	exportFile.appendChild(exportFilea);
	menuList.appendChild(exportFile);
	nanoContent.appendChild(menuList);
	nanoDiv.appendChild(nanoContent);
	yaybarDiv.appendChild(nanoDiv);
	document.body.appendChild(yaybarDiv);
	toggleButton.addEventListener('click', function(e){
		if(document.body.className == 'yay-hide') {
			document.body.className = '';
		} else {
			document.body.className = 'yay-hide';
		}
	});
}

function loadIndexModal() {
	var modalDiv = document.createElement("div");
	modalDiv.setAttribute('class','modal fade');
	modalDiv.setAttribute('id','reIndex');
	modalDiv.setAttribute('tabindex','-1');
	modalDiv.setAttribute('role','dialog');
	modalDiv.setAttribute('aria-labelledby','reIndexLabel');
	modalDiv.setAttribute('aria-hidden','true');
	var modalDialog = document.createElement("div");
	modalDialog.setAttribute('class','modal-dialog');
	var modalContent = document.createElement("div");
	modalContent.setAttribute('class','modal-content');
	var modalHeader = document.createElement("div");
	modalHeader.setAttribute('class','modal-header');
	var modalCloseIcon = document.createElement("button");
	modalCloseIcon.setAttribute('class','close');
	modalCloseIcon.setAttribute('data-dismiss','modal');
	modalCloseIcon.setAttribute('aria-label','Close');
	var modalCloseSpan = document.createElement("span");
	modalCloseSpan.setAttribute('aria-hidden','true');
	modalCloseSpan.innerHTML = "&times;";
	modalCloseIcon.appendChild(modalCloseSpan);
	modalHeader.appendChild(modalCloseIcon);
	var modalTitle = document.createElement("h4");
	modalTitle.setAttribute('class','modal-title');
	modalTitle.setAttribute('id','reIndexLabel');
	modalTitle.innerHTML = "Reindex Server";
	modalHeader.appendChild(modalTitle);
	modalContent.appendChild(modalHeader);
	var modalBody = document.createElement("div");
	modalBody.setAttribute('class','modal-body');
	var formDiv = document.createElement("div");
	formDiv.setAttribute('class','reIndexForm');
	formDiv.setAttribute('id','reIndexForm');
	var dataSubmit = document.createElement("button");
	dataSubmit.setAttribute('id','dataSubmit');
	dataSubmit.innerHTML = "Start Index";
	dataSubmit.addEventListener('click', reIndexServer);
	formDiv.appendChild(dataSubmit);
	modalBody.appendChild(formDiv);
	modalContent.appendChild(modalBody);
	var modalFooter = document.createElement("div");
	modalFooter.setAttribute('class','modal-footer');
	modalFooter.innerHTML = "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>";
	modalContent.appendChild(modalFooter);
	modalDialog.appendChild(modalContent);
	modalDiv.appendChild(modalDialog);
	document.body.appendChild(modalDiv);
}

function loadEmailModal() {
	var modalDiv = document.createElement("div");
	modalDiv.setAttribute('class','modal fade');
	modalDiv.setAttribute('id','myModal');
	modalDiv.setAttribute('tabindex','-1');
	modalDiv.setAttribute('role','dialog');
	modalDiv.setAttribute('aria-labelledby','myModalLabel');
	modalDiv.setAttribute('aria-hidden','true');
	var modalDialog = document.createElement("div");
	modalDialog.setAttribute('class','modal-dialog');
	var modalContent = document.createElement("div");
	modalContent.setAttribute('class','modal-content');
	var modalHeader = document.createElement("div");
	modalHeader.setAttribute('class','modal-header');
	var modalCloseIcon = document.createElement("button");
	modalCloseIcon.setAttribute('class','close');
	modalCloseIcon.setAttribute('data-dismiss','modal');
	modalCloseIcon.setAttribute('aria-label','Close');
	var modalCloseSpan = document.createElement("span");
	modalCloseSpan.setAttribute('aria-hidden','true');
	modalCloseSpan.innerHTML = "&times;";
	modalCloseIcon.appendChild(modalCloseSpan);
	modalHeader.appendChild(modalCloseIcon);
	var modalTitle = document.createElement("h4");
	modalTitle.setAttribute('class','modal-title');
	modalTitle.setAttribute('id','myModalLabel');
	modalTitle.innerHTML = "Email Stats";
	modalHeader.appendChild(modalTitle);
	modalContent.appendChild(modalHeader);
	var modalBody = document.createElement("div");
	modalBody.setAttribute('class','modal-body');
	var formDiv = document.createElement("div");
	formDiv.setAttribute('class','emailForm');
	formDiv.setAttribute('id','emailForm');
	var table = document.createElement("table");
	var nameRow = document.createElement("tr"), emailRow = document.createElement("tr"), toRow = document.createElement("tr");
	var nameInputCell = document.createElement("td"), emailInputCell = document.createElement("td"), toInputCell = document.createElement("td");
	var nameInput = document.createElement("input"), emailInput = document.createElement("input"), toInput = document.createElement("input");
	nameInput.setAttribute('type','text');
	emailInput.setAttribute('type','text');
	toInput.setAttribute('type','text');
	nameInput.setAttribute('id','nameInput');
	emailInput.setAttribute('id','emailInput');
	toInput.setAttribute('id','toInput');
	nameInputCell.appendChild(nameInput);
	nameRow.appendChild(nameInputCell);
	table.appendChild(nameRow);
	emailInputCell.appendChild(emailInput);
	emailRow.appendChild(emailInputCell);
	table.appendChild(emailRow);
	toInputCell.appendChild(toInput);
	toRow.appendChild(toInputCell);
	table.appendChild(toRow);
	formDiv.appendChild(table);
	var dataSubmit = document.createElement("button");
	dataSubmit.setAttribute('id','dataSubmit');
	dataSubmit.innerHTML = "Submit";
	dataSubmit.addEventListener('click', sendData);
	formDiv.appendChild(dataSubmit);
	modalBody.appendChild(formDiv);
	modalContent.appendChild(modalBody);
	var modalFooter = document.createElement("div");
	modalFooter.setAttribute('class','modal-footer');
	modalFooter.innerHTML = "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>";
	modalContent.appendChild(modalFooter);
	modalDialog.appendChild(modalContent);
	modalDiv.appendChild(modalDialog);
	document.body.appendChild(modalDiv);
}
