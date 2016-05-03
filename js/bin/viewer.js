var vizURL = "";
var refreshActive, replaceImg = false;
var workgroup = '';
var xsrf_token = '';
var viewId = 0;
var serverURL, hostname = '';
var parentWindow;
var viz;

var haveParent = function(theParentWindow) {
  parentWindow = theParentWindow;
}

var createNameValue = function (name, value, edit) {
  var div = "";
  div += "<div class='field'>";
  div += "<label>" + name + "</label>";
  if (edit) {
    div += "<span class='edit'><input type = 'text' value='" + value + "' ./></span>";
  }
  div += "<span class='view'>" + value + "</span>";
  div += "</div>";
  return div;
}

var loadViz = function (data) {
  console.log('Loading viz '+ data.link);
  $('title').html(data.name);
  var url = require('url');
  var urlParse = url.parse(data.link);
  serverURL = urlParse.protocol + '//' + urlParse.hostname;
  hostname = urlParse.hostname;
  vizURL = data.link;
  viewId = data.id;
  var createdAt = data.createdAt;
  createdAt = createdAt.replace('T',' ');
  createdAt = createdAt.substr(0,19);
  var updatedAt = data.updatedAt;
  updatedAt = createdAt.replace('T',' ');
  updatedAt = createdAt.substr(0,19);
  console.log(data);
  $('#viewInfo').append(createNameValue("Name:",data.name,true));
  $('#viewInfo').append(createNameValue("Site:",data.siteName,false));
  $('#viewInfo').append(createNameValue("Created:",createdAt,false));
  $('#viewInfo').append(createNameValue("Updated:",updatedAt,false));

  $('#authorInfo').append(createNameValue("Name:",data.owner.displayName,true));
  $('#authorInfo').append(createNameValue("Username:",data.owner.username,true));
  if (data.owner.serverAdmin) {
    $('#authorInfo').append(createNameValue("Server Admin?:","Yes",true));
  } else {
    $('#authorInfo').append(createNameValue("Server Admin?:","No",true));
  }
  var workbookID = data.workbook.id;
  parentWindow.window.tableauDB.fetchRecords(workbookID.toString(),"workbooks", function(twb) {
    $('#workbookInfo').append(createNameValue("Name:",twb[0].name,true));
    $('#workbookInfo').append(createNameValue("Sheet Count:",twb[0].sheetCount,false));
    var updatedAt = twb[0].updatedAt;
    updatedAt = updatedAt.replace('T',' ');
    updatedAt = updatedAt.substr(0,19);
    $('#workbookInfo').append(createNameValue("Updated At:",updatedAt,false));
    if(twb[0].displayTabs) {
      $('#workbookInfo').append(createNameValue("Show Tabs?:","Yes",false));
    } else {
      $('#workbookInfo').append(createNameValue("Show Tabs?:","No",false));
    }
  });
  parentWindow.window.tableauDB.fetchIndexRecords(data.workbook.id,"embeddatasources", "workbookId", function(ds) {
    for (var i=0; i < ds.length; i++) {
      var dataDS = ds[i];
      if (i > 0) {
        $('#dataInfo').append("<hr/>");
      }
      $('#dataInfo').append(createNameValue("Name:",dataDS.name,false));
      $('#dataInfo').append(createNameValue("Type:",dataDS.connectionTypeDisplayName,false));
      if (dataDS.hasAlert) {
        $('#dataInfo').append(createNameValue("Connection Warning?:","Yes",false));
      } else {
        $('#dataInfo').append(createNameValue("Connection Warning?:","No",false));
      }
      if ( dataDS.hasExtracts) {
        var refreshedAt = dataDS.lastRefreshedAt;
        refreshedAt = refreshedAt.replace('T',' ');
        refreshedAt = refreshedAt.substr(0,19);
        $('#dataInfo').append(createNameValue("Live?:","No",false));
        $('#dataInfo').append(createNameValue("Extract Refreshed:",refreshedAt,false));
      } else {
        $('#dataInfo').append(createNameValue("Live?:","Yes",false));
      }
      if (dataDS.connectionDetails.hasEmbeddedPassword) {
        $('#dataInfo').append(createNameValue("Embedded Password?:","Yes",false));
      } else {
        $('#dataInfo').append(createNameValue("Embedded Password?:","No",false));
      }
      if (dataDS.connectionDetails.connectionOAuth) {
        $('#dataInfo').append(createNameValue("OAuth?:","Yes",false));
      } else {
        $('#dataInfo').append(createNameValue("OAuth?:","No",false));
      }
      var updatedAt = dataDS.updatedAt;
      updatedAt = updatedAt.replace('T',' ');
      updatedAt = updatedAt.substr(0,19);
      $('#dataInfo').append(createNameValue("Updated:",updatedAt,false));
    }
  });
  var containerDiv = document.getElementById("vizContainer");
  if (data.filePath) {
    $('#vizContainer').append('<img class="snapshotImg" src="file://'+data.filePath+'"/>');
    $('#snapshot').prop('checked', true);
  } else {
    $('#snapshot').prop('checked', false);
    var url = vizURL + '?:refresh=yes',
        options = {
            hideTabs: true,
            width: "100%",
            height: "95vh",
            onFirstInteractive: function () {
              //viz.refreshDataAsync ();
              listenToMarksSelection();
              nw.Window.get().cookies.getAll({}, function(cookies) {
                cookies.forEach(function(cookie) {
                  if (cookie.name == "workgroup_session_id") {
                    workgroup = cookie.value;
                  } else if (cookie.name == "XSRF-TOKEN") {
                    xsrf_token = cookie.value;
                  }
                })
              });

            }
        };
    if (viz) { // If a viz object exists, delete it.
          viz.dispose();
      }
    viz = new tableau.Viz(containerDiv, url, options);
  }

}

var listenToMarksSelection = function() {
  viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, stopAutoRefresh);
  viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, stopAutoRefresh);
  viz.addEventListener(tableau.TableauEventName.PARAMETER_VALUE_CHANGE, stopAutoRefresh);
  viz.addEventListener(tableau.TableauEventName.STORY_POINT_SWITCH, stopAutoRefresh);
  viz.addEventListener(tableau.TableauEventName.TAB_SWITCH, stopAutoRefresh);
  viz.addEventListener(tableau.TableauEventName.CUSTOM_VIEW_SAVE, stopAutoRefresh);
}

function stopAutoRefresh() {
  console.log("Stopping Auto Refresh");
  if (refreshActive) {
    refreshActive = false;
    $('#autoRefresh').prop('checked', false);
  }
}

var refreshViz = function () {
  console.log('Refreshing viz ' + vizURL);
  var containerDiv = document.getElementById("vizContainer2"),
      url = vizURL + '?:refresh=yes',
      options = {
          hideTabs: true,
          width: "100%",
          height: "95vh",
          onFirstInteractive: function () {
            //viz.refreshDataAsync ();
            listenToMarksSelection();
            if(replaceImg) {
              replaceImg = false;
              $('#vizContainer').remove();
              $('#vizContainer2').css('width','100%');
              $('#vizContainer2').css('height','100%');
              $('#vizContainer2').css('visibility','');
              $('#vizContainer2').attr('id','vizContainer');
              $('body').append('<div id="vizContainer2" style="width:0px; height:0px;visibility: hidden;"></div>');
            } else if(refreshActive) {
              console.log('Swapping viz');
              setTimeout( function () {
                $('#vizContainer').remove();
                $('#vizContainer2').css('width','100%');
                $('#vizContainer2').css('height','100%');
                $('#vizContainer2').css('visibility','');
                $('#vizContainer2').attr('id','vizContainer');
                $('body').append('<div id="vizContainer2" style="width:0px; height:0px;visibility: hidden;"></div>');
              }, 1000);
              setTimeout( function () {
                refreshViz();
              }, 30000);
            }
          }
      };
  if (viz) { // If a viz object exists, delete it.
        viz.dispose();
    }
  if (refreshActive) {
    viz = new tableau.Viz(containerDiv, url, options);
  }
}

var swapToImg = function(callback) {
  var osenv = require('osenv');
  var dir = osenv.home()+'/Yupana/snapshots/'+hostname+'/';
  var imgPath = dir + viewId + '.png';
  $('#vizContainer').html('<img class="snapshotImg" src="file://'+imgPath+'"/>');
  callback();
}

var saveSnapshot = function(id, callback) {
  var osenv = require('osenv');
  var dir = osenv.home()+'/Yupana/snapshots/'+hostname+'/';
  var request = require("request").defaults({ encoding: null });
  var fs = require('fs');
  var options = { method: 'GET',
    url:  serverURL + '/vizql/sheetimage/'+id+'?:pixelratio=2.0&h='+nw.Window.get().height+'&w='+nw.Window.get().width+'&maxAge=240',
    strictSSL: false,
    headers:
     {
        'Cookie' : 'workgroup_session_id='+workgroup+'; XSRF-TOKEN='+xsrf_token,
        'x-xsrf-token':  xsrf_token,
        'cache-control': 'private, max-age=0, no-cache'
     }
  };
  request(options, function (error, response, body) {
    var filendir = require('filendir')
    var type = response.headers["content-type"];
    var prefix = "data:" + type + ";base64,";
    console.log(options);
    console.log(response);
    console.log(body);
    var data = body;
    filendir.wa(dir+id+'.png', data, function (err) {
      if (!err) {
        console.log('File written!')
        parentWindow.window.createSnapshot(id, dir+id+'.png');
      } else {
        console.log(err);
      }
      callback();
    })
  });
}

$('.menuBtn').click(function() {
  $('.menuBtn').toggleClass("fa-times");
  $('.menuBtn').toggleClass("fa-bars");
  if($('#menu').css('width')=='33px') {
    $('#menu').animate({
      'height': '300px',
      'width': '300px'
    },"fast", function () {
      $('#menu').css('height','inherit');
      $('#menuContents').animate({'visibility':'toggle'},"fast");
      $('#menu').css('box-shadow', '3px 3px 2px rgba(0,0,0,.1)');
      $('#menu').css('border', '1px solid #d4d4d4');
    });
    $('#menu').css('background-color','rgba(255,255,255,1)');
  } else {
    $('#menuContents').animate({'visibility':'toggle'},"fast");
    $('#menu').animate({
      'height': '30px',
      'width': '33px'
    },"fast", function() {
      $('#menu').css('background-color','rgba(255,255,255,0.5)');
      $('#menu').css('box-shadow', '');
      $('#menu').css('border', '');
    });

  }
});

$('.panel-title .link').click(function() {
  $('.panel-title').find('i').each( function() {
    console.log($(this));
    $(this)[0].className = "fa fa-caret-right";
  });
  $(this).find('i')[0].className = "fa fa-caret-down";
});

$('#autoRefresh').click(function() {
  if($('#autoRefresh').is(':checked')) {
    refreshActive = true;
    refreshViz();
  } else {
    refreshActive = false;
  }
});

$('#snapshot').click(function() {
  if($('#snapshot').prop('checked')) {

    saveSnapshot(viewId, function() {
      swapToImg(function() {
        console.log("Snapshot Saved");
      });
    });
  } else {
    replaceImg = true;
    refreshViz();
    const fs = require('fs');
    var osenv = require('osenv');
    var dir = osenv.home()+'/Yupana/snapshots/'+hostname+'/';
    var imgPath = dir + viewId + '.png';
    fs.unlink(imgPath, (err) => {
        if (err) throw err;
        parentWindow.window.removeSnapshot(viewId);
      });
  }
});
