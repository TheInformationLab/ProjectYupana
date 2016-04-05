var osenv = require('osenv');
var home = osenv.home();
var winston = require('winston');

var apiLogger = new (winston.Logger)({
    exitOnError: false, //don't crash on exception
    transports: [
        new (winston.transports.Console)({level: 'error',colorize: true, label: 'noAPIFunctions.js'}),
        new (winston.transports.File)({ level: 'verbose', filename: home + '/Yupana/logs/yupana.log', label: 'noAPIFunctions.js' })
    ]
});

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

module.exports = {

  getServerUsers: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getServerUsers',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getServerUsers',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getServerUsers","params":{"order":[{"field":"displayName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getServerUsers', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var serverUsers = results.result.users;
      dataset = dataset.concat(serverUsers);
      if(moreItems) {
        apiLogger.verbose('getServerUsers',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getServerUsers(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getServerUsers',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getSiteUsers: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getSiteUsers',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getSiteUsers',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getSiteUsers","params":{"order":[{"field":"displayName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getServerUsers', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var users = results.result.users;
      dataset = dataset.concat(users);
      if(moreItems) {
        apiLogger.verbose('getSiteUsers',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getSiteUsers(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getSiteUsers',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getGroups: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getGroups',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getGroups',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getGroups","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getGroups', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var groups = results.result.groups;
      dataset = dataset.concat(groups);
      if(moreItems) {
        apiLogger.verbose('getGroups',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getGroups(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getGroups',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getImage: function (imageURL, workgroup, xsrf_token, callback) {
    var request = require("request").defaults({ encoding: null });
    apiLogger.verbose('getImage',{'state':'Starting request','imageURL':imageURL,'workgroup':workgroup,'xsrf_token':xsrf_token});
    var options = {
      method: 'GET',
      url: imageURL,
      strictSSL: false,
      headers:
       {
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200)
      {
          var type = response.headers["content-type"];
          var prefix = "data:" + type + ";base64,";
          var base64 = new Buffer(body).toString('base64');
          var data = prefix + base64;
          apiLogger.verbose('getImage',{'state':'Request complete','imageURL':imageURL,'workgroup':workgroup,'xsrf_token':xsrf_token});
          callback(data);
      } else {
        apiLogger.error('getImage', error);
      }
    });
  },

  getViews: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getViews',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getViews',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getViews","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'},"statFields":["hitsTotal","hitsLastOneMonthTotal","hitsLastThreeMonthsTotal","hitsLastTwelveMonthsTotal","favoritesTotal"]}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getViews', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var views = results.result.views;
      dataset = dataset.concat(views);
      if(moreItems) {
        apiLogger.verbose('getViews',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getViews(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getViews',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getView: function (serverURL, workgroup, xsrf_token, viewID, callback) {
    var request = require("request");
    apiLogger.verbose('getView',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'viewID':viewID});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getView',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getView","params":{"id":"'+viewID+'"}}'
    };
    request(options, function (error, response, body) {
      if (error) {
        apiLogger.error('getView', error);
        callback("Error");
      } else {
        var results = JSON.parse(body);
        apiLogger.verbose('getView',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'viewID':viewID});
        callback(results.result);
      }
    });
  },

  getWorkbooks: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getWorkbooks',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getWorkbooks',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getWorkbooks","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'},"statFields":["hitsTotal","hitsLastOneMonthTotal","hitsLastThreeMonthsTotal","hitsLastTwelveMonthsTotal","favoritesTotal"]}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getWorkbooks', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var workbooks = results.result.workbooks;
      dataset = dataset.concat(workbooks);
      if(moreItems) {
        apiLogger.verbose('getWorkbooks',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getWorkbooks(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getWorkbooks',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getPublishedDataSources: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getPublishedDataSources',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasources',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasources","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"isPublished","value":true}]},"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'

    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getPublishedDataSources', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var datasources = results.result.datasources;
      dataset = dataset.concat(datasources);
      if(moreItems) {
        apiLogger.verbose('getPublishedDataSources',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getPublishedDataSources(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getPublishedDataSources',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getEmbeddedDataSources: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getEmbeddedDataSources',{'state':'Starting  request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasources',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasources","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"isPublished","value":false}]},"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getEmbeddedDataSources', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var datasources = results.result.datasources;
      dataset = dataset.concat(datasources);
      if(moreItems) {
        apiLogger.verbose('getEmbeddedDataSources',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getEmbeddedDataSources(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getEmbeddedDataSources',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getDataSource: function (serverURL, workgroup, xsrf_token, dsID, dataset, callback) {
    var request = require("request");
    apiLogger.verbose('getDataSource',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dsID':dsID,'dataset size':dataset.length});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasource',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasource","params":{"id":"'+dsID+'"}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getDataSource', error);
      var results = JSON.parse(body);
      apiLogger.verbose('getDataSource',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dsID':dsID,'dataset size':dataset.length});
      callback(results.result, dataset);
    });
  },

  getProjects: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getProjects',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getProjects',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getProjects","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getProjects', error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var projects = results.result.projects;
      dataset = dataset.concat(projects);
      if(moreItems) {
        apiLogger.verbose('getProjects',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getProjects(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getProjects',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'dataset size':dataset.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(dataset);
      }
    });
  },

  getExtractTasks: function (serverURL, workgroup, xsrf_token, siteId, tasksDs, scheduleDs, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getExtractTasks',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'tasks dataset size':tasksDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getExtractTasks',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getExtractTasks","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"siteId","value":"'+siteId+'"}]},"order":[{"field":"targetName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getExtractTasks', error);
      var results = JSON.parse(body);
      var tasks = results.result.tasks;
  		var schedules = results.result.schedules;
      var moreItems = results.result.moreItems;
      tasksDs = tasksDs.concat(tasks);
      scheduleDs = scheduleDs.concat(schedules);
      if(moreItems) {
        apiLogger.verbose('getExtractTasks',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'tasks dataset size':tasksDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getExtractTasks(serverURL, workgroup, xsrf_token, siteId, tasksDs, scheduleDs, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getExtractTasks',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'tasks dataset size':tasksDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(tasksDs,scheduleDs);
      }
    });
  },

  getSubscriptions: function (serverURL, workgroup, xsrf_token, siteId, subcriptionDs, scheduleDs, currentIndex, pageSize, callback) {
    var request = require("request");
    apiLogger.verbose('getSubscriptions',{'state':'Starting request','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'subscriptions dataset size':subcriptionDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getExtractTasks',
      gzip: true,
      strictSSL: false,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getSubscriptions","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"siteId","value":"'+siteId+'"}]},"order":[{"field":"targetName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) apiLogger.error('getSubscriptions', error);
      var results = JSON.parse(body);
      var subscriptions = results.result.subscriptions;
  		var schedules = results.result.schedules;
      var moreItems = results.result.moreItems;
      subcriptionDs = subcriptionDs.concat(subscriptions);
      scheduleDs = scheduleDs.concat(schedules);
      if(moreItems) {
        apiLogger.verbose('getSubscriptions',{'state':'More items','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'subscriptions dataset size':subcriptionDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
        return module.exports.getSubscriptions(serverURL, workgroup, xsrf_token, siteId, subcriptionDs, scheduleDs, currentIndex + pageSize, 1000, callback);
      } else {
        apiLogger.verbose('getSubscriptions',{'state':'Request complete','serverURL':serverURL,'workgroup':workgroup,'xsrf_token':xsrf_token,'siteID': siteId,'subscriptions dataset size':subcriptionDs.length,'schedules dataset size':scheduleDs.length,'currentIndex':currentIndex,'pageSize':pageSize});
        callback(subcriptionDs,scheduleDs);
      }
    });
  }

};
