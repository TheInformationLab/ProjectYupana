var tableauDB = (function () {
	var tDB = {};
	var datastore = null;

	tDB.open = function (callback) {

		// Open a connection to the datastore.
		var request = indexedDB.open('tableau', 7);

		// Handle datastore upgrades.
		request.onupgradeneeded = function (e) {
			//console.log("Upgrading Database")
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
			if (db.objectStoreNames.contains('groups')) {
				db.deleteObjectStore('groups');
			}
			if (db.objectStoreNames.contains('pubdatasources')) {
				db.deleteObjectStore('pubdatasources');
			}
			if (db.objectStoreNames.contains('embeddatasources')) {
				db.deleteObjectStore('embeddatasources');
			}
			if (db.objectStoreNames.contains('tasks')) {
				db.deleteObjectStore('tasks');
			}
			if (db.objectStoreNames.contains('subscriptions')) {
				db.deleteObjectStore('subscriptions');
			}
			if (db.objectStoreNames.contains('subscriptionSchedules')) {
				db.deleteObjectStore('subscriptionSchedules');
			}
			if (db.objectStoreNames.contains('sitestats')) {
				db.deleteObjectStore('sitestats');
			}
			// Create a new datastore.
			var store = db.createObjectStore('sites', {
					keyPath : 'id'
				});
			var store = db.createObjectStore('users', {
					keyPath : 'id'
				});
			store.createIndex("username","username",{unique:false});
			var store = db.createObjectStore('projects', {
					keyPath : 'id'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("ownerId","ownerId",{unique:false});
			var store = db.createObjectStore('workbooks', {
					keyPath : 'id'
				});
			store.createIndex("siteID","siteID",{unique:false});
			var store = db.createObjectStore('views', {
					keyPath : 'id'
				});
			store.createIndex("siteID","siteID",{unique:false});
			//store.createIndex("workbook_url","workbook-url",{unique:false});
			var store = db.createObjectStore('groups', {
					keyPath : 'id'
				});
			store.createIndex("siteID","siteID",{unique:false});
			var store = db.createObjectStore('pubdatasources', {
					keyPath : 'id'
				});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("name","name",{unique:false});
			var store = db.createObjectStore('embeddatasources', {
					keyPath : 'id'
				});
			store.createIndex("workbookId","workbookId",{unique:false});
			store.createIndex("siteID","siteID",{unique:false});
			store.createIndex("name","name",{unique:false});
			var store = db.createObjectStore('tasks', {
					keyPath : 'id'
				});
			store.createIndex("scheduleId","scheduleId",{unique:false});
			store.createIndex("siteId","siteId",{unique:false});
			store.createIndex("targetId","targetID",{unique:false});
			var store = db.createObjectStore('taskSchedules', {
					keyPath : 'id'
				});
			var store = db.createObjectStore('subscriptions', {
					keyPath : 'id'
				});
			store.createIndex("scheduleId","scheduleId",{unique:false});
			store.createIndex("siteId","siteId",{unique:false});
			store.createIndex("targetId","targetID",{unique:false});
			store.createIndex("userId","userId",{unique:false});
			var store = db.createObjectStore('subscriptionSchedules', {
					keyPath : 'id'
				});
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
		////console.log("Fetinging user: " + userID);
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
		////console.log("Fetinging user: " + userID);
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
	tDB.createSite = function (id, friendlyname, namespaceURL, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['sites'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('sites');

		var site = {
			'id' : id,
			'name' : friendlyname,
			'urlName' : namespaceURL
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
	 * Update Site
	*/
	tDB.updateSite = function (id, siteObj, callback) {

		var db = datastore;
		var transaction = db.transaction(['sites'], 'readwrite');
		var objStore = transaction.objectStore('sites');

		var delRequest = objStore.delete(id);

		delRequest.onsuccess = function(event){
			var db = datastore;
			var transaction = db.transaction(['sites'], 'readwrite');
			var objStore = transaction.objectStore('sites');
			var site = siteObj;
			var putRequest = objStore.put(site);
			putRequest.onsuccess = function (e) {
				callback(site);
			};
			// Handle errors.
			putRequest.onerror = tDB.onerror;
		}
		delRequest.onerror = tDB.onerror;
	}
	/**
	 * Create a new user
	*/
	tDB.createUser = function (user, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['users'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('users');

		// Create an object for the todo item.
		var user = user;

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
	tDB.createGroup = function (groupObj, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['groups'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('groups');

		// Create an object for the todo item.
		var group = groupObj;
		group.siteID = parseInt(siteID);

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
	tDB.createView = function (viewObj, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['views'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('views');

		// Create an object for the todo item.
		var view = viewObj;
		view.siteID = parseInt(siteID);

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
	tDB.createWorkbook = function (workbookObj, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['workbooks'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('workbooks');

		// Create an object for the todo item.
		var workbook = workbookObj;
		workbook.siteID = parseInt(siteID);

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
	tDB.createProject = function (prjObject, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['projects'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('projects');

		// Create an object for the todo item.
		var project = prjObject;
		project.siteID = siteID;

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
	 * Create a new published data source
	*/
	tDB.createPubDataSource = function (dsObject, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['pubdatasources'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('pubdatasources');

		// Create an object for the todo item.
		var pubdatasource = dsObject;
		pubdatasource.siteID = siteID;
		////console.log(pubdatasource);

		// Create the datastore request.
		var request = objStore.put(pubdatasource);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(pubdatasource);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new embedded data source
	*/
	tDB.createEmbedDataSource = function (dsObject, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['embeddatasources'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('embeddatasources');

		// Create an object for the todo item.
		var embeddatasource = dsObject;
		embeddatasource.siteID = siteID;
		////console.log(embeddatasource);

		// Create the datastore request.
		var request = objStore.put(embeddatasource);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(embeddatasource);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new task
	*/
	tDB.createTask= function (taskObj, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['tasks'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('tasks');

		// Create an object for the todo item.
		var task = taskObj;

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
	 * Create a new task scheudle
	*/
	tDB.createTaskSchedule = function (tskSchedule, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['taskSchedules'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('taskSchedules');

		// Create an object for the todo item.
		var taskSchedule = tskSchedule;

		// Create the datastore request.
		var request = objStore.put(taskSchedule);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(taskSchedule);
		};

		// Handle errors.
		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new subscription
	 */

	tDB.createSubscription= function (sub, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['subscriptions'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('subscriptions');

		// Create an object for the todo item.
		var subscription = sub;

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
	 * Create a new task scheudle
	*/
	tDB.createSubscriptionSchedule = function (subSchedule, siteID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['subscriptionSchedules'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('subscriptionSchedules');

		// Create an object for the todo item.
		var subscriptionSchedule = subSchedule;

		// Create the datastore request.
		var request = objStore.put(subscriptionSchedule);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(subscriptionSchedule);
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
		////console.log(table);
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
			//console.log("indexedDB: " + indexedDBName + " deleted");
		}
		dbreq.onerror = function (event) {
			//console.log("indexedDB.delete Error: " + event.message);
		}
	}
	catch (e) {
		//console.log("Error: " + e.message);
	}
}
