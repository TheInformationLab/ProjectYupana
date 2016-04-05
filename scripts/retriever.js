var appRoot = require('app-root-path');
var osenv = require('osenv');
var home = osenv.home();
var winston = require('winston');

var retLogger = new (winston.Logger)({
    exitOnError: false, //don't crash on exception
    transports: [
        new (winston.transports.Console)({level: 'error',colorize: true, label: 'retriever.js'}),
        new (winston.transports.File)({ level: 'verbose', filename: home + '/Yupana/logs/yupana.log', label: 'retriever.js' })
    ]
});

var noAPI = require(appRoot + "/scripts/noAPIFunctions.js");
var url = require('url');
var async = require('async');

process.on('message',function(msg){
  retLogger.info("onMessage", {'state':'Valid message received', msg});
  var status = {};
  status.siteUsers = false;
  status.groups = false;
  status.views = false;
  status.workbooks = false;
  status.publishedDataSources = false;
  status.embeddedDataSources = false;
  status.projects = false;
  status.tasks = false;
  status.taskSchedules = false;
  status.subscriptionSchedules = false;
  status.subscriptions = false;

  if(msg.serverURL != "" && msg.workgroup != "" && msg.token != "" && msg.site != "") {
    s = url.parse(msg.serverURL);

    async.parallel(
      [
        function getSiteUsers(callback) {
          retLogger.verbose('getSiteUsers',{'state':'Starting getSiteUsers','status':status});
          noAPI.getSiteUsers(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (siteUsers) {
            if (siteUsers[0] != null) {
              status.siteUsers = true;
              var response = {};
              response.type = 'site users';
              response.status = status;
              response.data = siteUsers;
              process.send(response);
            } else {
              status.siteUsers = true;
              var response = {};
              response.type = 'site users';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'site users');
          });
        },
        function getGroups(callback) {
          retLogger.verbose('getGroups',{'state':'Starting getGroups','status':status});
          noAPI.getGroups(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (groups) {
            if (groups[0] != null) {
              status.groups = true;
              var response = {};
              response.type = 'groups';
              response.status = status;
              response.data = groups;
              process.send(response);
            } else {
              status.groups = true;
              var response = {};
              response.type = 'groups';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'groups');
          });
        },
        function getViews(callback) {
          retLogger.verbose('getViews',{'state':'Starting getViews','status':status});
          noAPI.getViews(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (views) {
            if (views[0] != null) {
              var dataset = [];
              async.eachLimit(views, 5, function(view, callback) {
                if (view) {
                  if (view.usageInfo) {
                    var viewUsage = view.usageInfo;
                  } else {
                    var viewUsage = {};
                  }
                  noAPI.getView(msg.serverURL, msg.workgroup, msg.token, view.id, function(v) {
                    if (v == "Error") {
                      retLogger.error('getView',{'state':'Error retrieving view','view':view});
                      dataset.push(view);
                      callback();
                    } else {
                      v.usageInfo = viewUsage;
                      v.siteName = msg.siteName;
                      v.siteLuid = msg.siteLuid;
                      v.siteUrl = msg.siteUrl;
                      if (v.favorite || (v.hitsTimeSeries && v.hitsTimeSeries[11] > 10)) {
          							var imgSrc = msg.serverURL + "/" + v.thumbnailUrl;
          							noAPI.getImage(imgSrc, msg.workgroup, msg.token, function(image) {
          								v.image = image;
                          dataset.push(v);
                          callback();
          							});
                      } else {
                        dataset.push(v);
                        callback();
                      }
                    }
                  });
                }
              }, function (err) {
                if(err) throw err;
                var response = {};
                status.views = true;
                response.type = 'views';
                response.status = status;
                response.data = dataset;
                process.send(response);
                callback(null, 'views');
              });
            } else {
              var response = {};
              status.views = true;
              response.type = 'views';
              response.status = status;
              response.data = [];
              process.send(response);
              callback(null, 'views');
            }
          });
        },
        function getWorkbooks(callback) {
          retLogger.verbose('getWorkbooks',{'state':'Starting getWorkbooks','status':status});
          noAPI.getWorkbooks(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (workbooks) {
            if (workbooks[0] != null) {
              status.workbooks = true;
              var response = {};
              response.type = 'workbooks';
              response.status = status;
              response.data = workbooks;
              process.send(response);
            } else {
              status.workbooks = true;
              var response = {};
              response.type = 'workbooks';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'workbooks');
          });
        },
        function getPublishedDataSources(callback) {
          retLogger.verbose('getPublishedDataSources',{'state':'Starting getPublishedDataSources','status':status});
          noAPI.getPublishedDataSources(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (datasources) {
            if (datasources[0] != null) {
              var dataset = [];
              async.eachLimit(datasources, 5, function(datasource, callback) {
                if (datasource) {
                  noAPI.getDataSource(msg.serverURL, msg.workgroup, msg.token, datasource.id, dataset, function(ds, data) {
                    dataset.push(ds);
                    callback();
                  });
                }
              }, function (err) {
                if(err) throw err;
                status.publishedDataSources = true;
                var response = {};
                response.type = 'published data sources';
                response.status = status;
                response.data = dataset;
                process.send(response, '');
                callback(null, 'published data sources');
              });
            } else {
              status.publishedDataSources = true;
              var response = {};
              response.type = 'published data sources';
              response.status = status;
              response.data = [];
              process.send(response);
              callback(null, 'published data sources');
            }
          });
        },
        function getEmbeddedDataSources(callback) {
          retLogger.verbose('getEmbeddedDataSources',{'state':'Starting getEmbeddedDataSources','status':status});
          noAPI.getEmbeddedDataSources(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (datasources) {
            if (datasources[0] != null) {
              status.embeddedDataSources = true;
              var response = {};
              response.type = 'embedded data sources';
              response.status = status;
              response.data = datasources;
              process.send(response);
            } else {
              status.embeddedDataSources = true;
              var response = {};
              response.type = 'embedded data sources';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'embedded data sources');
          });
        },
        function getProjects(callback) {
          retLogger.verbose('getProjects',{'state':'Starting getProjects','status':status});
          noAPI.getProjects(msg.serverURL, msg.workgroup, msg.token, [], 0, 1000, function (projects) {
            if (projects[0] != null) {
              status.projects = true;
              var response = {};
              response.type = 'projects';
              response.status = status;
              response.data = projects;
              process.send(response);
            } else {
              status.projects = true;
              var response = {};
              response.type = 'projects';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'projects');
          });
        },
        function getExtractTasks(callback) {
          retLogger.verbose('getExtractTasks',{'state':'Starting getExtractTasks','status':status});
          noAPI.getExtractTasks(msg.serverURL, msg.workgroup, msg.token, msg.site, [],[], 0, 1000, function (tasks,schedules) {
            if (tasks[0] != null) {
              status.tasks = true;
              var response = {};
              response.type = 'tasks';
              response.status = status;
              response.data = tasks;
              process.send(response);
            } else {
              status.tasks = true;
              var response = {};
              response.type = 'tasks';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            if (schedules) {
              status.taskSchedules = true;
              var response = {};
              response.type = 'task schedules';
              response.status = status;
              response.data = schedules;
              process.send(response);
            } else {
              status.schedules = true;
              var response = {};
              response.type = 'task schedules';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'tasks');
          });
        },
        function getSubscriptions(callback) {
          retLogger.verbose('getSubscriptions',{'state':'Starting getSubscriptions','status':status});
          noAPI.getSubscriptions(msg.serverURL, msg.workgroup, msg.token, msg.site, [],[], 0, 1000, function (subscriptions, schedules) {
            if (subscriptions[0] != null) {
              status.subscriptions = true;
              var response = {};
              response.type = 'subscriptions';
              response.status = status;
              response.data = subscriptions;
              process.send(response);
            } else {
              status.subscriptions = true;
              var response = {};
              response.type = 'subscriptions';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            if (schedules) {
              status.subscriptionSchedules = true;
              var response = {};
              response.type = 'subscription schedules';
              response.status = status;
              response.data = schedules;
              process.send(response);
            } else {
              status.subscriptionSchedules = true;
              var response = {};
              response.type = 'subscription schedules';
              response.status = status;
              response.data = [];
              process.send(response);
            }
            callback(null, 'subscriptions');
          });
        }
      ],
      function(err, results) {
        if (err) throw retLogger.error('asyncParallel',err);
      });
    //getExtractTasks_noAPI();
    //getSubscriptions_noAPI();
  } else {
    retLogger.error("onMessage", {'state':'Invalid message', msg});
  }
})

process.on('uncaughtException',function(err){
  retLogger.error('uncaughtException',err);
  console.log("retriever.js: " + err.message + "\n" + err.stack + "\n Stopping data collection");
})
