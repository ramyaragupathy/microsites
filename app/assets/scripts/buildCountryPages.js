var rp = require('request-promise');
var fs = require('fs')
var Promise = require('bluebird')
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash')
var turf = require('turf')
var dissolve = require('@turf/dissolve');
var helpers = require('@turf/helpers');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();

  /*-------------------------------------------------------
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
var tasksList = _.uniq(tasks.features.map((d) => { return d.properties.task; }));
Promise.map(tasksList, (task) => {
  var taskGeometries = turf.featureCollection(
    tasks.features.filter((feature) => {
      if (feature.properties.task === task) {
        return turf.polygon(
          feature.geometry.coordinates[0],
          {task: feature.properties.task}
        );
      }
    })
  );
  var taskStates = _.uniq(taskGeometries.features.map((s) => { return s.properties.state; }));
  taskStates = taskStates.filter((num) => {
    if (num > -1) { return num; }
  });
  if (taskStates.length > 0) {
    const centroid = turf.centroid(taskGeometries);
    return centroid.geometry.coordinates;
  }
})
.then((taskCentroids) => {
  Promise.map(taskCentroids, (centroid) => {
    if (centroid !== undefined) {
      return crg.get_country(centroid[1], centroid[0]);
    }
  })
  .then((country) => {
    console.log(country);
  });
});
// taskCentroids = turf.featureCollection(taskCentroids);
// console.log(taskCentroids);
//
// taskCentroids.forEach((task) => {
//
// });
//     rp(geojsonOptions)
//     .then(function(geojsonResults) {
//       const country = turf.featureCollection(geojsonResults)
//       const tasksWithinCountry = turf.within(taskCentroids,country)
//       console.log(tasksWithinCountry)
//     })
//     .catch(function(error) {
//       console.log(error)
//     })
//     // const countryFile = '../../_country/' + country[0] + '.md'
//     // fs.writeFileSync(countryFile, '---')
//     // fs.appendFileSync(countryFile, '\n')
//     // fs.appendFileSync(countryFile, 'layout: country \n')
//     // fs.appendFileSync(countryFile, 'lang: en \n')
//     // fs.appendFileSync(countryFile, 'permalink: /' + country + '/ \n')
//     // fs.appendFileSync(countryFile, 'name: ' + country + '\n')
//     // fs.appendFileSync(countryFile, 'tm-projects: \n')
//     // fs.appendFileSync(countryFile, '---')
//   })
// })
