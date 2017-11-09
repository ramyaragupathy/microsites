var fs = require('fs');
var path = require('path');
var flow = require('flow');
var request = require('request');
var moment = require("moment");

var missingmaps = [];

var throttleProjects = function(cb){
<<<<<<< HEAD
  var targetCount = 4000;
=======
  var targetCount = 5000;
>>>>>>> tm3-update
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
<<<<<<< HEAD
    uri: "http://tasks.hotosm.org/api/v1/project/${projectNumber}/summary"
=======
    uri: "https://tasks.hotosm.org/api/v1/project/" + projectNumber + "/summary"
>>>>>>> tm3-update
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var jsonResponse = JSON.parse(body);

      if(jsonResponse){
        /// capitalization or presence/lack of a space in Missing Maps shouldn't matter
        var nameCheck = jsonResponse.name.replace(/\s+/g, '').toLowerCase().indexOf("missingmaps");
        if(nameCheck !== -1){
<<<<<<< HEAD
          // projectList.push(projectNumber); // # # # compile list of project numbers to next fetch detailed task data
          var projectObj = {
            "task_number": projectNumber,
            "created" : jsonResponse.created.slice(0,10),
            "name": jsonResponse.name.replace(/"/g,""),
            // "changeset_comment":jsonResponse.properties["changeset_comment"],
            // "author": jsonResponse.properties["author"],
            "status":jsonResponse.status,
            "done": jsonResponse.percentMapped,
            "validated": jsonResponse.percentValidated
          }
          missingmaps.push(projectObj);
=======

          missingmaps.push(jsonResponse);
>>>>>>> tm3-update
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

<<<<<<< HEAD
var throttleTasks = function(cb){
  var targetCount = 0;
  var counter = 0;
  targetCount = missingmaps.length;
  for (var i=0;i<targetCount;i++) {
     (function(ind) {
         setTimeout(function(){
           // # # # throttle process to limit the speed of calls to download files from the server
           fetchTaskData(ind, function(){
             counter ++;
             if(counter === targetCount){ cb(); }
           });
         }, 500 + (100 * ind));
     })(i);
  }
}

var fetchTaskData = function(prjIndex, cb) {
  var thisPrj = missingmaps[prjIndex];
  // console.log("http://tasks.hotosm.org/project/" + thisPrj["task_number"] + "/tasks.json")
  request({
    method: 'GET',
    uri: 'http://tasks.hotosm.org/api/v1/project/' + thisPrj["task_number"]
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var tasks = JSON.parse(body);
      for(var i=0; i<tasks.features.length; i++){
        var tile = jsonResponse.features[i];
        var thisState = tile.properties.state;
        // 2 is done and 3 is validated
        // https://github.com/hotosm/osm-tasking-manager2/wiki/API#list-of-tasks-with-state-and-lock-status
        var tileProp = {
            "task": thisPrj["task_number"],
            "created": thisPrj["created"],
            "state": thisState
        };
        tasksFc.features.push(turf.feature(tile.geometry, tileProp));
        }

      }
      console.log("processed tasks for #" + thisPrj["task_number"]);
      cb();
  });
}

var parseTasks = flow.define(
  function(){
    throttleTasks(this);
  },
  function(){
    var filePath = path.join('./', "tasks.geojson");
    fs.writeFile(filePath, JSON.stringify(tasksFc));
  }
);

=======
>>>>>>> tm3-update
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
