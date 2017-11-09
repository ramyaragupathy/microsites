var fs = require('fs');
var path = require('path');
var flow = require('flow');
var request = require('request');
var moment = require("moment");
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var md = require('node-markdown').Markdown;
var _ = require('lodash');

var missingmaps = [];

function parseDesc (desc) {
  desc = md(desc, true, 'p').match(/<p>(.*?)<\/p>/g);
  if (desc !== null) {
    desc = desc.map((p) => {
      let content = p;
      if (!(p.match(/The Missing Maps project aims to map/))) {
        content = p.replace(/<\/?p>/g, '');
      }
      if (content.match(/[\*]/g)) {
        content = content.replace(/[\*]/g, '');
        console.log('wow')
      }
      return content
    }).filter((descItem) => {
      if (descItem !== null) {
        return descItem;
      }
    }).join(' ')
      .replace(/:/g, '.');
  } else {
    desc = '';
  }
  return desc;
};

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
         }, 1 + (10 * ind));
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
        if(nameCheck !== -1 && jsonResponse.status == 'PUBLISHED'){

          var country = crg.get_country(jsonResponse.aoiCentroid.coordinates[1], jsonResponse.aoiCentroid.coordinates[0]);
          if (!!country) {
            //bug in the crg code used returns the wrong iso code for south sudan
            if (country.code == 'SDS') {
              country.code = 'SSD';
            }
            jsonResponse.country = country.code;
          }
          jsonResponse.shortDescription = parseDesc(jsonResponse.shortDescription);

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

function makeTasks(cb) {
  var filePath = path.join('./', "tasks.json");
  fs.writeFile(filePath, JSON.stringify(missingmaps));
  cb();
}

function groupTasks(cb) {
  console.log("updates.json");
  detailedTasks = _.groupBy(missingmaps, (mmtask) => {

    return mmtask.country;
  });
  detailedTasks = _.omit(detailedTasks, undefined);
  // make value for each country an obj with 'tm-project' key matching
  // fm objects used elsewhere
  const detailedTasksFin = {};
  _.forEach(detailedTasks, (v, k) => {
    const detailedTaskFin = {};
    const detailedTaskKey = k;
    detailedTaskFin['tm-projects'] = v;
    detailedTasksFin[detailedTaskKey] = detailedTaskFin;
  });
  fs.writeFile('./updates.json', JSON.stringify(detailedTasksFin));

  cb();
}

var parseProjects = flow.define(
  function(){
    throttleProjects(this);
  },
  function(){
    makeTasks(this);
  },
  function(){
    groupTasks(this);
  }
);

parseProjects();
