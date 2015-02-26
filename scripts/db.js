var tableauDB = (function () {
	var tDB = {};
	var datastore = null;

	tDB.open = function (callback) {
		// Database version.
		var version = 2;

		// Open a connection to the datastore.
		var request = indexedDB.open('tableau', version);

		// Handle datastore upgrades.
		request.onupgradeneeded = function (e) {
			var db = e.target.result;

			e.target.transaction.onerror = tDB.onerror;

			// Delete the old datastore.
			if (db.objectStoreNames.contains('users')) {
				db.deleteObjectStore('users');
			}
			if (db.objectStoreNames.contains('workbooks')) {
				db.deleteObjectStore('workbooks');
			}
			if (db.objectStoreNames.contains('groups')) {
				db.deleteObjectStore('groups');
			}
			if (db.objectStoreNames.contains('User2Group')) {
				db.deleteObjectStore('User2Group');
			}

			// Create a new datastore.
			var store = db.createObjectStore('users', {
					keyPath : 'userID'
				});
			var store = db.createObjectStore('workbooks', {
					keyPath : 'twbID'
				});
			var store = db.createObjectStore('groups', {
					keyPath : 'grpID'
				});
			var store = db.createObjectStore('User2Group', {
					keyPath : 'userID'
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
	 * Fetch all of the users in the datastore.
	 * @param {function} callback A function that will be executed once the items
	 *                            have been retrieved. Will be passed a param with
	 *                            an array of the users.
	 */
	tDB.fetchUsers = function (userID, callback) {
		var db = datastore;
		var transaction = db.transaction(['users'], 'readwrite');
		var objStore = transaction.objectStore('users');
		console.log("Fetinging user: " + userID);
		var intID = parseInt(userID);
		if (intID > 0) {
			var keyRange = IDBKeyRange.only(userID);
		} else {
			var keyRange = IDBKeyRange.lowerBound(0);
		}
		var cursorRequest = objStore.openCursor(keyRange);

		var users = [];

		transaction.oncomplete = function (e) {
			// Execute the callback function.
			callback(users);
		};

		cursorRequest.onsuccess = function (e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			users.push(result.value);

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
	 * Create a new user
	*/
	tDB.createUser = function (userID, username, friendlyname, email, licensinglevel, administrator, admintype, publisher, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['users'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('users');

		// Create an object for the todo item.
		var user = {
			'username' : username,
			'userID' : userID,
			'friendlyName' : friendlyname,
			'email' : email,
			'licensingLevel' : licensinglevel,
			'administrator' : administrator,
			'adminType' : admintype,
			'publisher' : publisher
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
	 * Create a new group2user
	*/
	tDB.createUser2Group = function (groupID, userID, callback) {
		// Get a reference to the db.
		var db = datastore;

		// Initiate a new transaction.
		var transaction = db.transaction(['User2Group'], 'readwrite');

		// Get the datastore.
		var objStore = transaction.objectStore('User2Group');

		// Create an object for the todo item.
		var User2Grp = {
			'grpID' : groupID,
			'userID' : userID
		};

		// Create the datastore request.
		var request = objStore.put(User2Grp);

		// Handle a successful datastore put.
		request.onsuccess = function (e) {
			// Execute the callback function.
			callback(User2Grp);
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
