var apiToken = "";
var apiLevel = 0;
var siteCount = 0;

function checkAPIAccess() {
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
		getSites();
	};
	loginResponse.send(loginXML);
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