var tableauDB = (function () {
	var tDB = {};
	var datastore = null;

	tDB.open = function (callback) {

		// Open a connection to the datastore.
		var request = indexedDB.open('tableau', 7);

		// Handle datastore upgrades.
		request.onupgradeneeded = function (e) {
			console.log("Upgrading Database")
			var db = e.target.result;

			e.target.transaction.onerror = tDB.onerror;

			// Delete the old datastore.
			if (db.objectStoreNames.contains('sites')) {
				db.deleteObjectStore('sites');
			}
			if (db.objectStoreNames.contains('users')) {
				db.deleteObjectStore('users');
			}
			if (db.objectStoreNames.contains('projects')) {
				db.deleteObjectStore('projects');
			}
			if (db.objectStoreNames.contains('workbooks')) {
				db.deleteObjectStore('workbooks');
			}
			if (db.objectStoreNames.contains('views')) {
				db.deleteObjectStore('views');
			}
			if (db.objectStoreNames.contains('dataconnections')) {
				db.deleteObjectStore('dataconnections');
			}
			if (db.objectStoreNames.contains('groups')) {
				db.deleteObjectStore('groups');
			}
			if (db.objectStoreNames.contains('datasources')) {
				db.deleteObjectStore('datasources');
			}
			if (db.objectStoreNames.contains('tasks')) {
				db.deleteObjectStore('tasks');
			}
			if (db.objectStoreNames.contains('subscriptions')) {
				db.deleteObjectStore('subscriptions');
			}
			if (db.objectStoreNames.contains('sitestats')) {
				db.deleteObjectStore('sitestats');
			}
			// Create a new datastore.
			var store = db.createObjectStore('sites', {
					keyPath : 'siteID'
				});
			store.createIndex("friendlyName","friendlyName",{unique:false});
			var store = db.createObjectStore('users', {
					keyPath : 'name'
				});
			store.createIndex("friendly_name","friendly_name",{unique:false});
			store.createIndex("admin_type","admin_type",{unique:false});
			store.createIndex("administrator","administrator",{unique:false});
			store.createIndex("licensing_level","licensing_level",{unique:false});
			store.createIndex("publisher","publisher",{unique:false});
			var store = db.createObjectStore('projects', {
					keyPath : 'projID'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("name","name",{unique:false});
			store.createIndex("ownerID","ownerID",{unique:false});
			store.createIndex("projID","projID",{unique:false});
			var store = db.createObjectStore('workbooks', {
					keyPath : 'workbookID'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("name","name",{unique:false});
			store.createIndex("ownerID","ownerID",{unique:false});
			store.createIndex("projectID","projectID",{unique:false});
			var store = db.createObjectStore('views', {
					keyPath : 'viewID'
				});
			store.createIndex("name","name",{unique:false});
			store.createIndex("ownerID","ownerID",{unique:false});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("title","title",{unique:false});
			//store.createIndex("workbook_url","workbook-url",{unique:false});
			var store = db.createObjectStore('dataconnections', {
					keyPath : 'dconnID'
				});
			var store = db.createObjectStore('groups', {
					keyPath : 'groupID'
				});
			store.createIndex("name","name",{unique:false});
			store.createIndex("siteID","siteID",{unique:false});
			var store = db.createObjectStore('datasources', {
					keyPath : 'dataID'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("name","name",{unique:false});
			store.createIndex("ownerID","ownerID",{unique:false});
			var store = db.createObjectStore('tasks', {
					keyPath : 'taskID'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("scheduleName","scheduleName",{unique:false});
			store.createIndex("targetID","targetID",{unique:false});
			store.createIndex("targetName","targetName",{unique:false});
			store.createIndex("targetType","targetType",{unique:false});
			store.createIndex("type","type",{unique:false});
			var store = db.createObjectStore('subscriptions', {
					keyPath : 'subscriptionID'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("scheduleName","scheduleName",{unique:false});
			store.createIndex("subject","subject",{unique:false});
			store.createIndex("userEmail","userEmail",{unique:false});
			store.createIndex("userID","userID",{unique:false});
			store.createIndex("userName","userName",{unique:false});
			var store = db.createObjectStore('sitestats', {
					autoIncrement: true
				});
			store.createIndex("friendlyname","friendlyName",{unique:false});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("table","table",{unique:false});
			store.createIndex("StatValue",["siteID","table"],{unique:true});
		};

		// Handle successful datastore access.
		request.onsuccess = function (e) {
			// Get a reference to the DB.
			datastore = e.target.result;

			// Execute the callback.
			callback();
		};

		// Handle errors when opening the datastore.
		request.onerror = tDB.onerror;
	};
	
	/**
	Count Records in Table
	**/
	
	tDB.numberofRecords = function(table, callback) {
		var db = datastore;
		var transaction = db.transaction([table], "readonly");
		var objectStore = transaction.objectStore(table); 
		var count = objectStore.count();

		count.onsuccess = function() {
			callback(count.result);
		};		
	}
		
	

	/**
	 * Fetch all of the values or one specific record from a table
	 */
	tDB.fetchRecords = function (recordID, table, callback) {
		var db = datastore;
		var transaction = db.transaction([table], 'readonly');
		var objStore = transaction.objectStore(table);
		//console.log("Fetinging user: " + userID);
		var intID = parseInt(recordID);
		if (intID > 0) {
			var keyRange = IDBKeyRange.only(intID);
		} else {
			var keyRange = IDBKeyRange.lowerBound(0);
		}
		var cursorRequest = objStore.openCursor(keyRange);

		var records = [];

		transaction.oncomplete = function (e) {
			// Execute the callback function.
			callback(records);
		};

		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			records.push(result.value);

			result.continue();
		};

		cursorRequest.onerror = tDB.onerror;
	};
	
	/**
	 * Fetch all of the values or one specific record from a table based on a specific index
	 */
	tDB.fetchIndexRecords = function (statName, table, indexName, callback) {
		var db = datastore;
		var transaction = db.transaction([table], 'readonly');
		var objStore = transaction.objectStore(table);
		var index = objStore.index(indexName);
		//console.log("Fetinging user: " + userID);
		if (statName) {
			var keyRange = IDBKeyRange.only(statName);
		} else {
			var keyRange = IDBKeyRange.lowerBound(0);
		}
		var cursorRequest = index.openCursor(keyRange);

		var records = [];

		transaction.oncomplete = function (e) {
			// Execute the callback function.
			callback(records);
		};

		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			records.push(result.value);

			result.continue();
		};

		cursorRequest.onerror = tDB.onerror;
	};

	/**
	 * Create a new site
	*/
	tDB.createSite = function (siteID, friendlyname, namespaceURL, user_quota, content_admin_mode, storage_quota, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['sites'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('sites');

		var site = {
			'siteID' : siteID,
			'friendlyName' : friendlyname,
			'namespaceURL' : namespaceURL,
			'user_quota' : user_quota,
			'content_admin_mode' : content_admin_mode,
			'storage_quota' : storage_quota
		};

		// Create the datastore request.
		var request = objStore.put(site);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(site);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new user
	*/
	tDB.createUser = function (name, friendly_name, email, licensing_level, administrator, admin_type, publisher, raw_data_suppressor, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['users'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('users');

		// Create an object for the todo item.
		var user = {
			'name' : name,
			'friendly_name' : friendly_name,
			'email' : email,
			'licensing_level' : licensing_level,
			'administrator' : administrator,
			'admin_type' : admin_type,
			'publisher' : publisher,
			'raw_data_suppressor' : raw_data_suppressor
		};

		// Create the datastore request.
		var request = objStore.put(user);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(user);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new group
	*/
	tDB.createGroup = function (groupID, name, domain, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['groups'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('groups');

		// Create an object for the todo item.
		var group = {
			'groupID' : groupID,
			'name' : name,
			'domain' : domain,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(group);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(group);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new view
	*/
	tDB.createView = function (viewID, name, title, index, repository_url, preview_url, updated_at, created_at, ownerID, workbook_url, customized_view_count,siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['views'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('views');

		// Create an object for the todo item.
		var view = {
			'viewID' : viewID,
			'name' : name,
			'title' : title,
			'index' : index,
			'repository-url' : repository_url,
			'preview-url' : preview_url,
			'updated-at' : updated_at,
			'created-at' : created_at,
			'ownerID' : ownerID,
			'workbook-url' : workbook_url,
			'customized-view-count' : customized_view_count,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(view);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(view);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new workbook
	*/
	tDB.createWorkbook = function (workbookID, name, size, path, ownerID, projectID , tasks_count, updated_at,created_at, repository_url, tabs_allowed,siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['workbooks'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('workbooks');

		// Create an object for the todo item.
		var workbook = {
			'workbookID' : workbookID,
			'name' : name,
			'size' : size,
			'path' : path,
			'ownerID' : ownerID,
			'projectID' : projectID,
			'tasks-count' : tasks_count,
			'updated-at' : updated_at,
			'created-at' : created_at,
			'repository-url' : repository_url,
			'tabs-allowed' : tabs_allowed,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(workbook);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(workbook);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new project
	*/
	tDB.createProject = function (projID, name, updated_at, created_at, ownerID, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['projects'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('projects');

		// Create an object for the todo item.
		var project = {
			'projID' : projID,
			'name' : name,
			'updated-at' : updated_at,
			'created-at' : created_at,
			'ownerID' : ownerID,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(project);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(project);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new data source
	*/
	tDB.createDataSource = function (dataID, name, repository_url, ownerID, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['datasources'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('datasources');

		// Create an object for the todo item.
		var datasource = {
			'dataID' : dataID,
			'name' : name,
			'repository-url' : repository_url,
			'ownerID' : ownerID,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(datasource);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(datasource);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new task
	*/
	tDB.createTask= function (taskID, type, priority, targetID, targetName, targetType, scheduleID, scheduleName, schedulePriority,
								 scheduleEnabled, schedule_next_run, schedule_updated_at, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['tasks'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('tasks');

		// Create an object for the todo item.
		var task = {
			'taskID' : taskID,
			'type' : type,
			'priority' : priority,
			'targetID' : targetID,
			'targetName' : targetName,
			'targetType' : targetType,
			'scheduleID' : scheduleID,
			'scheduleName' : scheduleName,
			'schedulePriority' : schedulePriority,
			'scheduleEnabled' : scheduleEnabled,
			'schedule_next_run' : schedule_next_run,
			'schedule_updated_at' : schedule_updated_at,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(task);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(task);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new subscription
	 */
	
	tDB.createSubscription= function (subscriptionID, subject, userID, userName, userEmail, scheduleID, scheduleName, schedulePriority,
								 scheduleEnabled, schedule_next_run, schedule_updated_at, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['subscriptions'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('subscriptions');

		// Create an object for the todo item.
		var subscription = {
			'subscriptionID' : subscriptionID,
			'subject' : subject,
			'userID' : userID,
			'userName' : userName,
			'userEmail' : userEmail,
			'scheduleID' : scheduleID,
			'scheduleName' : scheduleName,
			'schedulePriority' : schedulePriority,
			'scheduleEnabled' : scheduleEnabled,
			'schedule_next_run' : schedule_next_run,
			'schedule_updated_at' : schedule_updated_at,
			'siteID' : siteID
		};

		// Create the datastore request.
		var request = objStore.put(subscription);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(subscription);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	/**
	 * Create a new site stat
	*/
	tDB.createSiteStat = function (siteID, friendlyname, table, value, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['sitestats'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('sitestats');

		var site = {
			'siteID' : parseInt(siteID),
			'friendlyName' : friendlyname,
			'table' : table,
			'count' : parseInt(value)
		};

		// Create the datastore request.
		var request = objStore.put(site);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(site);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	
	tDB.countRecords = function (tables, siteID, callback) {
		var result = [];
		var table = "";
		for (i = 0, table; table = tables[i]; i++){
			tDB.doCount(table,parseInt(siteID),function(count){
				result[i]=count;
			});
		}
	}
	
    tDB.doCount = function (table, siteID, siteName, callback) {
		var db = datastore;
		//console.log(table);
		var transaction = db.transaction([table],"readonly");
		var count = 0;
			
		transaction.oncomplete = function(event) {
			callback(table, siteID, siteName, count);
		};
	 
		var handleResult = function(event) {  
			var cursor = event.target.result;  
			if (cursor) {  
				count = count + 1;
				cursor.continue();  
			  }  
		};
	 
			var objectStore = transaction.objectStore(table);
	 
			if(siteID) {
				var range = IDBKeyRange.only(siteID);
				var index = objectStore.index("siteID");
				index.openCursor(range).onsuccess = handleResult;
			} else {
				
				objectStore.openCursor().onsuccess = handleResult;
			}
	}

	// Export the tDB object.
	return tDB;
}());

function deleteDB(indexedDBName) {
	try {
		var dbreq = window.indexedDB.deleteDatabase(indexedDBName);
		dbreq.onsuccess = function (event) {
		var db = event.result;
			console.log("indexedDB: " + indexedDBName + " deleted");
		}
		dbreq.onerror = function (event) {
			console.log("indexedDB.delete Error: " + event.message);
		}	
	}
	catch (e) {
		console.log("Error: " + e.message);
	}
}