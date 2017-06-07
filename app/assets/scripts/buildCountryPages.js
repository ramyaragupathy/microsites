var rp = require('request-promise');
var fs = require('fs')
var Promise = require('bluebird')
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash')
var turf = require('turf')

 /* -------------------------------------------------------
  ----------- Get List centroids for open Tasks -----------
  -------------------------------------------------------*/


/*
  To get the list of centroids for open tasks:
    1) create list of tasks apart of larger tasking manager task as
       'taskGeometries'
    2) get list of taskGeometries tasks' states, which tell whether or not the
       task is completed
    3) using the power of indexof() find out if the states included are
       either 'invalidated' or 'open'. this suggests tasks are still being
       worked on
    4) if either of those states are present for task at hand,
       get the centroid of those taskGeometries and push it to taskCentroids
       list
*/

// list of unique tasks
var tasksList = _.uniq(tasks.features.map((d) => {return d.properties.task}));
var taskCentroids = []

tasksList.forEach((d) => {
  var taskGeometries = tasks.features.filter((f) => {
    if(f.properties.task === d) {return turf.polygon(f.geometry.coordinates[0])}
  })
  var taskStates = _.uniq(taskGeometries.map((s) => {return s.properties.state}))
  taskStates = [taskStates.indexOf(0),taskStates.indexOf(1)].filter((num) => {
    if(num > -1) {return num};
  })
  if(taskStates.length > 0) {
    var taskCentroid = turf.centroid(turf.featureCollection(taskGeometries))
    taskCentroid.properties = d
    taskCentroids.push(taskCentroid)
  }
})
taskCentroids = turf.featureCollection(taskCentroids)

/* -------------------------------------------------------
 ------------ Add tasks to correct countries ------------
 -------------------------------------------------------*/

/*
  With forEach, the following steps make country files for each country
    1) make a file {country}.md with writeFileSync
    2) append each line of metadata as defined in the country-example.md file
*/

// const options = {uri:'http://osmstats.redcross.org/countries',json:true}
const countryOptions = {uri:'http://localhost:3000/countries',json: true}

rp(countryOptions)
.then(function(countryResults){
  countryResults.forEach((country) => {
    // generate api call to boundaries
    const geojsonOptions = {
      uri:'https://raw.githubusercontent.com/AshKyd/geojson-regions/master/countries/10m/' + country[1] + '.geojson',
      json:true
    }
    rp(geojsonOptions)
    .then(function(geojsonResults) {
      const country = turf.featureCollection(geojsonResults)
      const tasksWithinCountry = turf.within(taskCentroids,country)
      console.log(tasksWithinCountry)
    })
    .catch(function(error) {
      console.log(error)
    })
    // const countryFile = '../../_country/' + country[0] + '.md'
    // fs.writeFileSync(countryFile, '---')
    // fs.appendFileSync(countryFile, '\n')
    // fs.appendFileSync(countryFile, 'layout: country \n')
    // fs.appendFileSync(countryFile, 'lang: en \n')
    // fs.appendFileSync(countryFile, 'permalink: /' + country + '/ \n')
    // fs.appendFileSync(countryFile, 'name: ' + country + '\n')
    // fs.appendFileSync(countryFile, 'tm-projects: \n')
    // fs.appendFileSync(countryFile, '---')
  })
})
