function startWebServer(port) {
  fs=require('fs');

  var express = require('express');
  var app = express();
  var __dirname=fs.realpathSync('.');

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use(express.static(__dirname + '/wdc'));

  app.get('/views', function (req, res, next) {
    console.log("Views Requested");
    tableauDB.fetchRecords(0,"views", function(views) {
      res.end(JSON.stringify(views));
    });
  })

  app.get('/viewStats', function (req, res, next) {
    console.log("Weekly View Stats Requested");
    tableauDB.fetchRecords(0,"views", function(views) {
      res.end(JSON.stringify(views));
    });
  })

  app.get('/serverUsers', function (req, res, next) {
    console.log("Server Users Requested");
    tableauDB.fetchRecords(0,"serverUsers", function(users) {
      res.end(JSON.stringify(users));
    });
  })

  app.get('/embedDataSources', function (req, res, next) {
    console.log("Embedded Data Sources Requested");
    tableauDB.fetchRecords(0,"embeddatasources", function(data) {
      res.end(JSON.stringify(data));
    });
  })

  app.listen(port, function() {
    console.log('Webserver Up!');
  });
}
