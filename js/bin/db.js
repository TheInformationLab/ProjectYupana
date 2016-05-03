var tableauDB = (function () {
	var dbLogger = winston.loggers.get('db');
	var tDB = {};
	var datastore = null;

	tDB.open = function (callback) {
		dbLogger.verbose('open',{'state':'Starting open database'});

		// Open a connection to the datastore.
		var request = indexedDB.open('tableau', 4);

		// Handle datastore upgrades.
		request.onupgradeneeded = function (e) {
			dbLogger.verbose('open',{'state':'Upgrading database'});
			var db = e.target.result;

			e.target.transaction.onerror = tDB.onerror;

			// Delete the old datastore.
			if (db.objectStoreNames.contains('servers')) {
				db.deleteObjectStore('servers');
			}
			if (db.objectStoreNames.contains('sites')) {
				db.deleteObjectStore('sites');
			}
			if (db.objectStoreNames.contains('serverUsers')) {
				db.deleteObjectStore('serverUsers');
			}
			if (db.objectStoreNames.contains('siteUsers')) {
				db.deleteObjectStore('siteUsers');
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
			if (db.objectStoreNames.contains('taskSchedules')) {
				db.deleteObjectStore('taskSchedules');
			}
			if (db.objectStoreNames.contains('sitestats')) {
				db.deleteObjectStore('sitestats');
			}
			if (db.objectStoreNames.contains('viewThumbnails')) {
				db.deleteObjectStore('viewThumbnails');
			}
			if (db.objectStoreNames.contains('snapshots')) {
				db.deleteObjectStore('snapshots');
			}
			// Create a new datastore.
			var store = db.createObjectStore('servers', {
					keyPath : 'serverUrl'
				});
			store.createIndex("currentServer","currentServer",{unique:false});
			var store = db.createObjectStore('sites', {
					keyPath : 'id'
				});
			var store = db.createObjectStore('siteUsers', {
					keyPath : 'id'
				});
			store.createIndex("username","username",{unique:false});
			store.createIndex("siteID","siteID",{unique:false});
			var store = db.createObjectStore('serverUsers', {
					keyPath : 'id'
				});
			store.createIndex("username","username",{unique:true});
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
			store.createIndex("trending",["thisWeekHits","siteUrl"],{unique:false});
			store.createIndex("favorite",["isFavorite","siteUrl"],{unique:false});
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
			var store = db.createObjectStore('viewThumbnails', {
					keyPath : 'id'
				});
			var store = db.createObjectStore('snapshots', {
					keyPath : 'id'
				});
		};

		request.onsuccess = function (e) {
			datastore = e.target.result;
			callback();
		};
		request.onerror = tDB.onerror;
	};

	/**
	Count Records in Table
	**/

	tDB.numberofRecords = function(table, rtnParam, callback) {
		var db = datastore;
		var transaction = db.transaction([table], "readonly");
		var objectStore = transaction.objectStore(table);
		var count = objectStore.count();

		count.onsuccess = function() {
			callback(count.result, rtnParam);
		};
	}



	/**
	 * Fetch all of the values or one specific record from a table
	 */
	tDB.fetchRecords = function (recordID, table, callback) {
		var db = datastore;
		var transaction = db.transaction([table], 'readonly');
		var objStore = transaction.objectStore(table);

		if (recordID == 0) {
			var keyRange = IDBKeyRange.lowerBound(0);
		} else {
			var keyRange = IDBKeyRange.only(recordID);
		}
		var cursorRequest = objStore.openCursor(keyRange);

		var records = [];

		transaction.oncomplete = function (e) {
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

		if (statName) {
			var keyRange = IDBKeyRange.only(statName);
		} else {
			var keyRange = IDBKeyRange.lowerBound(0);
		}
		var cursorRequest = index.openCursor(keyRange);

		var records = [];

		transaction.oncomplete = function (e) {
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
	 * Fetch a range of values from a table based on a specific index
	 */
	tDB.fetchIndexRange = function (fromVal, toVal, table, indexName, callback) {
		var db = datastore;
		var transaction = db.transaction([table], 'readonly');
		var objStore = transaction.objectStore(table);
		var index = objStore.index(indexName);
		var keyRange = IDBKeyRange.bound(fromVal,toVal);
		var cursorRequest = index.openCursor(keyRange, 'next');

		var records = [];

		transaction.oncomplete = function (e) {
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
	 * Create a new server
	*/
	tDB.createServer = function (serverUrl, serverObj, callback) {
		var db = datastore;
		var transaction = db.transaction(['servers'], 'readwrite');
		var objStore = transaction.objectStore('servers');

		var server = serverObj;
		server.serverUrl = serverUrl;
		server.currentServer = 0;
		var request = objStore.put(server);

		request.onsuccess = function (e) {
			callback(server);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Update Server
	*/
	tDB.updateCurrentServer = function (serUrl, serverObj, current, callback) {

		var db = datastore;
		var transaction = db.transaction(['servers'], 'readwrite');
		var objStore = transaction.objectStore('servers');

		var delRequest = objStore.delete(serUrl);

		delRequest.onsuccess = function(event){
			var db = datastore;
			var transaction = db.transaction(['servers'], 'readwrite');
			var objStore = transaction.objectStore('servers');
			var server = serverObj;
			server.serverUrl = serUrl;
			server.currentServer = parseInt(current);
			var putRequest = objStore.put(server);
			putRequest.onsuccess = function (e) {
				callback(server);
			};

			putRequest.onerror = tDB.onerror;
		}
		delRequest.onerror = tDB.onerror;
	}
	/**
	 * Create a new site
	*/
	tDB.createSite = function (id, friendlyname, namespaceURL, callback) {
		var db = datastore;
		var transaction = db.transaction(['sites'], 'readwrite');
		var objStore = transaction.objectStore('sites');

		var site = {
			'id' : parseInt(id),
			'name' : friendlyname,
			'urlName' : namespaceURL
		};

		var request = objStore.put(site);

		request.onsuccess = function (e) {
			callback(site);
		};

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
			site.id = parseInt(site.id);
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
	 * Create a new site user
	*/
	tDB.createSiteUser = function (site, user, callback) {
		var db = datastore;
		var transaction = db.transaction(['siteUsers'], 'readwrite');
		var objStore = transaction.objectStore('siteUsers');
		user.siteID = site;
		var request = objStore.put(user);
		request.onsuccess = function (e) {
			callback(user);
		};
		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new site user
	*/
	tDB.createServerUser = function (user, callback) {
		var db = datastore;
		var transaction = db.transaction(['serverUsers'], 'readwrite');
		var objStore = transaction.objectStore('serverUsers');

		var user = user;
		var request = objStore.put(user);

		request.onsuccess = function (e) {
			callback(user);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new group
	*/
	tDB.createGroup = function (groupObj, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['groups'], 'readwrite');
		var objStore = transaction.objectStore('groups');

		var group = groupObj;
		group.siteID = parseInt(siteID);
		var request = objStore.put(group);

		request.onsuccess = function (e) {
			callback(group);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new view
	*/
	tDB.createView = function (viewObj, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['views'], 'readwrite');
		var objStore = transaction.objectStore('views');

		var view = viewObj;
		view.siteID = parseInt(siteID);
		if(view.favorite) {
			view.isFavorite = 1;
		} else {
			view.isFavorite = 0;
		}
		if(view.hitsTimeSeries) {
			view.thisWeekHits = view.hitsTimeSeries[11];
		} else {
			view.thisWeekHits = 0;
		}

		var request = objStore.put(view);
		request.onsuccess = function (e) {
			callback(view);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new workbook
	*/
	tDB.createWorkbook = function (workbookObj, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['workbooks'], 'readwrite');
		var objStore = transaction.objectStore('workbooks');

		var workbook = workbookObj;
		workbook.siteID = parseInt(siteID);
		var request = objStore.put(workbook);

		request.onsuccess = function (e) {
			callback(workbook);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new project
	*/
	tDB.createProject = function (prjObject, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['projects'], 'readwrite');
		var objStore = transaction.objectStore('projects');

		var project = prjObject;
		project.siteID = siteID;
		var request = objStore.put(project);

		request.onsuccess = function (e) {
			callback(project);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new published data source
	*/
	tDB.createPubDataSource = function (dsObject, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['pubdatasources'], 'readwrite');
		var objStore = transaction.objectStore('pubdatasources');

		var pubdatasource = dsObject;
		pubdatasource.siteID = siteID;
		var request = objStore.put(pubdatasource);

		request.onsuccess = function (e) {
			callback(pubdatasource);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new embedded data source
	*/
	tDB.createEmbedDataSource = function (dsObject, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['embeddatasources'], 'readwrite');
		var objStore = transaction.objectStore('embeddatasources');

		var embeddatasource = dsObject;
		embeddatasource.siteID = siteID;
		var request = objStore.put(embeddatasource);

		request.onsuccess = function (e) {
			callback(embeddatasource);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new task
	*/
	tDB.createTask= function (taskObj, callback) {
		var db = datastore;
		var transaction = db.transaction(['tasks'], 'readwrite');
		var objStore = transaction.objectStore('tasks');

		var task = taskObj;
		var request = objStore.put(task);
		request.onsuccess = function (e) {
			callback(task);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new task scheudle
	*/
	tDB.createTaskSchedule = function (tskSchedule, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['taskSchedules'], 'readwrite');
		var objStore = transaction.objectStore('taskSchedules');

		var taskSchedule = tskSchedule;
		var request = objStore.put(taskSchedule);
		request.onsuccess = function (e) {
			callback(taskSchedule);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new subscription
	 */

	tDB.createSubscription= function (sub, callback) {
		var db = datastore;
		var transaction = db.transaction(['subscriptions'], 'readwrite');
		var objStore = transaction.objectStore('subscriptions');

		var subscription = sub;
		var request = objStore.put(subscription);
		request.onsuccess = function (e) {
			callback(subscription);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new subscription
	 */

	tDB.storeViewThumbnail= function (imageObj, callback) {
		var db = datastore;
		var transaction = db.transaction(['viewThumbnails'], 'readwrite');
		var objStore = transaction.objectStore('viewThumbnails');

		var request = objStore.put(imageObj);
		request.onsuccess = function (e) {
			callback(imageObj);
		};

		request.onerror = tDB.onerror;
	};
	/**
	 * Create a new task scheudle
	*/
	tDB.createSubscriptionSchedule = function (subSchedule, siteID, callback) {
		var db = datastore;
		var transaction = db.transaction(['subscriptionSchedules'], 'readwrite');
		var objStore = transaction.objectStore('subscriptionSchedules');

		var subscriptionSchedule = subSchedule;
		var request = objStore.put(subscriptionSchedule);

		request.onsuccess = function (e) {
			callback(subscriptionSchedule);
		};

		request.onerror = tDB.onerror;
	};

	/**
	 * Create a new site stat
	*/
	tDB.createSiteStat = function (siteID, friendlyname, table, value, callback) {
		var db = datastore;
		var transaction = db.transaction(['sitestats'], 'readwrite');
		var objStore = transaction.objectStore('sitestats');

		var site = {
			'siteID' : parseInt(siteID),
			'friendlyName' : friendlyname,
			'table' : table,
			'count' : parseInt(value)
		};

		var request = objStore.put(site);
		request.onsuccess = function (e) {
			callback(site);
		};

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
	};

    tDB.doCount = function (table, siteID, siteName, callback) {
		var db = datastore;
		//////console.log(table);
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
	};

	tDB.saveSnapshot = function (viewObj, filePath, callback) {
		var db = datastore;
		var transaction = db.transaction(['snapshots'], 'readwrite');
		var objStore = transaction.objectStore('snapshots');


		var snapshot = viewObj;
		snapshot.filePath = filePath;
		var request = objStore.put(snapshot);

		request.onsuccess = function (e) {
			callback(snapshot);
		};

		request.onerror = tDB.onerror;
	}

	tDB.deleteSnapshot = function (id, callback) {

		var db = datastore;
		var transaction = db.transaction(['snapshots'], 'readwrite');
		var objStore = transaction.objectStore('snapshots');

		var delRequest = objStore.delete(id);

		delRequest.onsuccess = function(event){
			callback(id);
		}
		delRequest.onerror = tDB.onerror;
	}

	tDB.clearData = function (tableArr, callback) {
		var db = datastore;
		if(tableArr.length > 0) {
			for(var i = 0; i < tableArr.length; i++) {
			  var transaction = db.transaction([tableArr[i]], "readwrite");
			  var objectStore = transaction.objectStore(tableArr[i]);
			  var objectStoreRequest = objectStore.clear();

			  objectStoreRequest.onsuccess = function(event) {
			    callback();
			  };
				objectStoreRequest.onerror = tDB.onerror;
			}
		}
	};

	return tDB;
}());

deleteDB = function (indexedDBName) {
	try {
		var dbreq = window.indexedDB.deleteDatabase(indexedDBName);
		dbreq.onsuccess = function (event) {
		var db = event.result;
		}
		dbreq.onerror = function (event) {
		}
	}
	catch (e) {
	}
}
