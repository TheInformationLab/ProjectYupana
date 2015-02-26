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

function getUsersGroups(workbookID,workbookRep,callback) {
	var element = document.querySelector('#userContainer');
	//element.parentNode.removeChild(element);
	if (typeof element === 'undefined' || element == null) {
	} else {
		var aux = element.parentNode;
		aux.removeChild(element);
	}
	var userXML = new XMLHttpRequest();
	userXML.open(
		"GET",
		fullURL+"/users.xml",
		true);
	console.log("getValidUsers: userXML.onload");
	userXML.onload = function(){
		users = userXML.responseXML.getElementsByTagName("user");
		for (var i = 0, user; user = users[i]; i++) {
			var userID = user.getElementsByTagName("id")[0].innerHTML;
			var username = user.getElementsByTagName("name")[0].innerHTML;
			var friendlyname = user.getElementsByTagName("friendly_name")[0].innerHTML;
			var email = user.getElementsByTagName("email")[0].innerHTML;
			var licensinglevel = user.getElementsByTagName("licensing_level")[0].innerHTML;
			var administrator = user.getElementsByTagName("administrator")[0].innerHTML;
			var admintype = user.getElementsByTagName("admin_type")[0].innerHTML;
			var publisher = user.getElementsByTagName("publisher")[0].innerHTML;
			tableauDB.createUser(userID,username,friendlyname,email,licensinglevel,administrator,admintype,publisher, function() {
				console.log("User "+ username+" saved!");
			});
		}
		var lexXML = new XMLHttpRequest();
		lexXML.open(
			"GET",
			fullURL+"/lexicon28/permissions.xml",
			true);
		console.log("getValidUsers: lexXML.onload");
		lexXML.onload = function(){
			groups = lexXML.responseXML.getElementsByTagName("group");
			for (var i = 0, group; group = groups[i]; i++) {
				var groupID = group.getElementsByTagName("id")[0].innerHTML;
				var name = group.getElementsByTagName("name")[0].innerHTML;
				var friendlyname = group.getElementsByTagName("friendly_name")[0].innerHTML;
				tableauDB.createGroup(groupID,name,friendlyname, function() {
					console.log("Group "+ name +" saved!");
				});
				addUserstoGroups (groupID);
			}
			callback();
		};
		lexXML.send(null);		
	};
	userXML.send(null);
};

function addUserstoGroups (groupID) {
	var grpXML = new XMLHttpRequest();
	grpXML.open(
		"GET",
		fullURL+"/get_members/groups/"+groupID+".xml",
		true);
	console.log("getUsersPerGroup: grpXML.onload");
	grpXML.onload = function(){
		members = grpXML.responseXML.getElementsByTagName("group_members")[0].innerHTML;
		//console.log(members);
		console.log("Group "+groupID+" - Size: "+members.length);
		if (members.length > 1){
			userGrps = grpXML.responseXML.getElementsByTagName("user");
			for (var i = 0, userGrp; userGrp = userGrps[i]; i++) {
				userID = userGrp.getElementsByTagName("id")[0].innerHTML;
				tableauDB.createUser2Group(groupID,userID,function() {
					console.log("User "+ userID +" added to group "+groupID);
				});
			}
		}
	}
	grpXML.send(null);
};

function buildPermissionsArray(workbookID,workbookRep) {
	var permArray = [];
	var permXML = new XMLHttpRequest();
	permXML.open(
		"GET",
		fullURL+"/workbook28/permissions/"+workbookRep+".xml",
		true);
	console.log("buildPermissionsArray: permXML.onload");
	permXML.onload = function(){
		console.log("This is when the permArray will be built");
		var permArray = [];
		tableauDB.fetchUsers(0, function(users) {
			for(var i = 0, user; user = users[i]; i++){
				permArray[user.userID] = 'none';
			}
			console.log(permArray);
			assignUserPermissions(permArray, permXML);
		});
	}
	permXML.send(null);
};

function assignUserPermissions(permArray, permXML) {
	var grantees = permXML.responseXML.getElementsByTagName("grantee");
	for(var i = 0, grantee; grantee = grantees[i]; i++){
		var isGroup = grantee.getElementsByTagName("is_group")[0].innerHTML;
		console.log(isGroup);
		if (isGroup == 'false') {
			var userID = grantee.getElementsByTagName("id")[0].innerHTML;
			console.log("Building user "+ userID+" permissions array");
			var capabilities = grantee.getElementsByTagName("capability");
			var capabilityStr = '';
			for(var j = 0, capability; capability = capabilities[j]; j++){
				if(capability.getElementsByTagName("is_allowed")[0].innerHTML == 'true') {
					capabilityStr = capabilityStr.concat(capability.getElementsByTagName("name")[0].innerHTML," ");
				} else if (capability.getElementsByTagName("is_allowed")[0].innerHTML == 'false') {
					capabilityStr = capabilityStr.concat("!",capability.getElementsByTagName("name")[0].innerHTML," ");
				}
			}
			permArray[userID] = capabilityStr;
		} else {
			var groupID = grantee.getElementsByTagName("id")[0].innerHTML;
			console.log("Building group "+ groupID+" permissions array");
			var capabilities = grantee.getElementsByTagName("capability");
			var capabilityStr = '';
			for(var j = 0, capability; capability = capabilities[j]; j++){
				if(capability.getElementsByTagName("is_allowed")[0].innerHTML == 'true') {
					//loop through group & append to existing user string
					// >>>>>>>>>>>> Should be group to user array?????  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
				} else if (capability.getElementsByTagName("is_allowed")[0].innerHTML == 'false') {
					//loop through group & append to existing user string
				}
			}
			
		}
	}
	console.log(permArray);
};


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

function fetchSiteAdmins(userContainer, twbOwner) {
	tableauDB.fetchUsers(0, function(users) {
			//userContainer.appendChild(AdminTitle);
			var AdminTitle = document.createElement("div");
			AdminTitle.setAttribute('class','adminTitle');
			AdminTitle.setAttribute('id','adminTitle');
			AdminTitle.innerHTML = "administrators >";
			userContainer.appendChild(AdminTitle);
			for(var i = 0, user; user = users[i]; i++) {
				if (user.administrator == "true" && parseInt(user.userID) == parseInt(twbOwner)){
					var userItem = document.createElement("div");
					userItem.setAttribute('class','users');
					userItem.setAttribute('id','users');
					userItem.innerHTML = user.friendlyName; 
					userContainer.appendChild(userItem);
				}
			}
			document.body.appendChild(userContainer);
			var userIsoContainer = document.querySelector('#userContainer');
			var useriso = new Isotope( userIsoContainer );
			useriso.arrange({
			  // options
			  itemSelector: '.users',
			  layoutMode: 'cellsByRow',
			  cellsByRow: {
				//containerStyle: null,
				columnWidth: 210,
				rowHeight: 60
			  }
			});
			useriso.on('layoutComplete', function(isoInstance, laidOutItems){
				//document.querySelector('#userContainer').style.position = 'static';
				//document.querySelector('#userContainer').style.paddingLeft = '220px';
				console.log("User Layout Done!");
			});
			document.querySelector('#userContainer').style.position = 'static';
			document.querySelector('#userContainer').style.paddingLeft = '220px';
			useriso.bindResize();
			useriso.layout();
		});
};