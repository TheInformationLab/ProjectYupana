var tableauDB = (function () {
	var tDB = {};
	var datastore = null;

	tDB.open = function (callback) {
		// Database version.
		var version = 1;

		// Open a connection to the datastore.
		var request = indexedDB.open('tableau', version);

		// Handle datastore upgrades.
		request.onupgradeneeded = function (e) {
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
			// Create a new datastore.
			var store = db.createObjectStore('sites', {
					keyPath : 'siteID'
				});
			var store = db.createObjectStore('users', {
					keyPath : 'userID'
				});
			var store = db.createObjectStore('projects', {
					keyPath : 'projID'
				});
			var store = db.createObjectStore('workbooks', {
					keyPath : 'wrkID'
				});
			var store = db.createObjectStore('views', {
					keyPath : 'viewID'
				});
			var store = db.createObjectStore('dataconnections', {
					keyPath : 'dconnID'
				});
			var store = db.createObjectStore('groups', {
					keyPath : 'grpID'
				});
			var store = db.createObjectStore('datasources', {
					keyPath : 'dsID'
				});
			var store = db.createObjectStore('tasks', {
					keyPath : 'taskID'
				});
			var store = db.createObjectStore('subscriptions', {
					keyPath : 'subscID'
				});
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
	 * Fetch all of the workbooks in the datastore.
	 * @param {function} callback A function that will be executed once the items
	 *                            have been retrieved. Will be passed a param with
	 *                            an array of the users.
	 */
	tDB.fetchWorkbooks = function (twbID, callback) {
		var db = datastore;
		var transaction = db.transaction(['workbooks'], 'readwrite');
		var objStore = transaction.objectStore('workbooks');
		var twbInt = parseInt(twbID);
		console.log("Fetching workbook: " + twbInt);
		if (twbInt > 0) {
			var keyRange = IDBKeyRange.only(twbID);
		} else {
			var keyRange = IDBKeyRange.lowerBound(0);
		}
		var cursorRequest = objStore.openCursor(keyRange);

		var workbooks = [];

		transaction.oncomplete = function (e) {
			// Execute the callback function.
			console.log(workbooks);
			callback(workbooks);
		};

		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			workbooks.push(result.value);

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
	tDB.createUser = function (userID, name, friendly_name, email, licensing_level, administrator, admin_type, publisher, raw_data_suppressor, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['users'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('users');

		// Create an object for the todo item.
		var user = {
			'userID' : userID,
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
	 * Create a new view
	*/
	tDB.createView = function (viewID, name, title, index, repository_url, preview_url, updated_at, created_at, ownerID, workbook_url, customized_view_count, callback) {
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
			'customized-view-count' : customized_view_count
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
	tDB.createTwb = function (twbID, name, path, ownerID, projectID, updatedat, createdat, repositoryurl, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['workbooks'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('workbooks');

		// Create an object for the todo item.
		var workbook = {
			'twbID' : twbID,
			'name' : name,
			'path' : path,
			'ownerID' : ownerID,
			'projectID' : projectID,
			'updated-at' : updatedat,
			'created-at' : createdat,
			'repository-url' : repositoryurl
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
	 * Create a new group
	 */
	tDB.createGroup = function (groupID, name, friendlyname, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['groups'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('groups');

		// Create an object for the todo item.
		var group = {
			'grpID' : groupID,
			'name' : name,
			'friendlyname' : friendlyname
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
	 * Delete a todo item.
	 * @param {int} id The timestamp (id) of the todo item to be deleted.
	 * @param {function} callback A callback function that will be executed if the
	 *                            delete is successful.
	 */
	tDB.deleteUser = function (id, callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var request = objStore.delete(id);

		request.onsuccess = function (e) {
			callback();
		}

		request.onerror = function (e) {
			console.log(e);
		}
	};

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