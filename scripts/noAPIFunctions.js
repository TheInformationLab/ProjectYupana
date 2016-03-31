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

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getServerUsers',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getServerUsers","params":{"order":[{"field":"displayName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var serverUsers = results.result.users;
      dataset = dataset.concat(serverUsers);
      if(moreItems) {
        return module.exports.getServerUsers(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getSiteUsers: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getSiteUsers',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getSiteUsers","params":{"order":[{"field":"displayName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var users = results.result.users;
      dataset = dataset.concat(users);
      if(moreItems) {
        return module.exports.getSiteUsers(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getGroups: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getGroups',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getGroups","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var groups = results.result.groups;
      dataset = dataset.concat(groups);
      if(moreItems) {
        return module.exports.getGroups(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getImage: function (serurl, workgroup, xsrf_token, callback) {
    var request = require("request").defaults({ encoding: null });

    var options = {
      method: 'GET',
      url: serurl,
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
          //console.log(data);
          callback(data);
      }
    });
  },

  getViews: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getViews',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getViews","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'},"statFields":["hitsTotal","hitsLastOneMonthTotal","hitsLastThreeMonthsTotal","hitsLastTwelveMonthsTotal","favoritesTotal"]}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var views = results.result.views;
      dataset = dataset.concat(views);
      if(moreItems) {
        return module.exports.getViews(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getView: function (serverURL, workgroup, xsrf_token, viewID, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getView',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getView","params":{"id":"'+viewID+'"}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      callback(results.result);
    });
  },

  getWorkbooks: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getWorkbooks',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getWorkbooks","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'},"statFields":["hitsTotal","hitsLastOneMonthTotal","hitsLastThreeMonthsTotal","hitsLastTwelveMonthsTotal","favoritesTotal"]}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var workbooks = results.result.workbooks;
      dataset = dataset.concat(workbooks);
      if(moreItems) {
        return module.exports.getWorkbooks(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getPublishedDataSources: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasources',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasources","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"isPublished","value":true}]},"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'

    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var datasources = results.result.datasources;
      dataset = dataset.concat(datasources);
      if(moreItems) {
        return module.exports.getPublishedDataSources(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getEmbeddedDataSources: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasources',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasources","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"isPublished","value":false}]},"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var datasources = results.result.datasources;
      dataset = dataset.concat(datasources);
      if(moreItems) {
        return module.exports.getEmbeddedDataSources(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getDataSource: function (serverURL, workgroup, xsrf_token, dsID, dataset, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getDatasource',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body: '{"method":"getDatasource","params":{"id":"'+dsID+'"}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      callback(results.result, dataset);
    });
  },

  getProjects: function (serverURL, workgroup, xsrf_token, dataset, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getProjects',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getProjects","params":{"order":[{"field":"name","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var moreItems = results.result.moreItems;
      var projects = results.result.projects;
      dataset = dataset.concat(projects);
      if(moreItems) {
        return module.exports.getProjects(serverURL, workgroup, xsrf_token, dataset, currentIndex + pageSize, 1000, callback);
      } else {
        callback(dataset);
      }
    });
  },

  getExtractTasks: function (serverURL, workgroup, xsrf_token, siteId, tasksDs, scheduleDs, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getExtractTasks',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getExtractTasks","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"siteId","value":"'+siteId+'"}]},"order":[{"field":"targetName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var tasks = results.result.tasks;
  		var schedules = results.result.schedules;
      var moreItems = results.result.moreItems;
      tasksDs = tasksDs.concat(tasks);
      scheduleDs = scheduleDs.concat(schedules);
      if(moreItems) {
        return module.exports.getExtractTasks(serverURL, workgroup, xsrf_token, siteId, tasksDs, scheduleDs, currentIndex + pageSize, 1000, callback);
      } else {
        callback(tasksDs,scheduleDs);
      }
    });
  },

  getSubscriptions: function (serverURL, workgroup, xsrf_token, siteId, subcriptionDs, scheduleDs, currentIndex, pageSize, callback) {
    var request = require("request");

    var options = { method: 'POST',
      url: serverURL + '/vizportal/api/web/v1/getExtractTasks',
      gzip: true,
      headers:
       {
          'Accept-Encoding' : 'gzip, deflate',
          'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
          'x-xsrf-token':  xsrf_token
       },
      body:  '{"method":"getSubscriptions","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"siteId","value":"'+siteId+'"}]},"order":[{"field":"targetName","ascending":true}],"page":{"startIndex":'+currentIndex+',"maxItems":'+pageSize+'}}}'
    };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      var results = JSON.parse(body);
      var subscriptions = results.result.subscriptions;
  		var schedules = results.result.schedules;
      var moreItems = results.result.moreItems;
      subcriptionDs = subcriptionDs.concat(subscriptions);
      scheduleDs = scheduleDs.concat(schedules);
      if(moreItems) {
        return module.exports.getSubscriptions(serverURL, workgroup, xsrf_token, siteId, subcriptionDs, scheduleDs, currentIndex + pageSize, 1000, callback);
      } else {
        callback(subcriptionDs,scheduleDs);
      }
    });
  }

};
