var fs = require('fs');
var path = require('path');
var flow = require('flow');
var request = require('request');
var moment = require("moment");

var missingmaps = [];

var throttleProjects = function(cb){
  var targetCount = 5000;
  var counter = 0;
  for (var i=0;i<targetCount;i++) {
     (function(ind) {
         setTimeout(function(){
           // # # # throttle process to limit the speed of calls to download files from the server
           fetchProjectData(ind, function(){
             counter ++;
             if(counter === targetCount){ cb(); }
           })
         }, 500 + (100 * ind));
     })(i);
  }
}

var fetchProjectData = function(projectNumber, cb) {
  request({
    method: 'GET',
    uri: "https://tasks.hotosm.org/api/v1/project/" + projectNumber + "/summary"
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var jsonResponse = JSON.parse(body);

      if(jsonResponse){
        /// capitalization or presence/lack of a space in Missing Maps shouldn't matter
        var nameCheck = jsonResponse.name.replace(/\s+/g, '').toLowerCase().indexOf("missingmaps");
        if(nameCheck !== -1){

          missingmaps.push(jsonResponse);
          console.log("missingmaps :  " + projectNumber);
        } else { console.log("other task  :  " + projectNumber); }
      }
      cb();
    } else {
      console.log("failed     :  " + projectNumber)
      console.log("error      :  " + error )
      cb();
    }
  });
}

var parseProjects = flow.define(
  function(){
    throttleProjects(this);
  },
  function(){
    var filePath = path.join('./', "tasks.geojson");
    fs.writeFile(filePath, JSON.stringify(missingmaps));
  }
);

parseProjects();
