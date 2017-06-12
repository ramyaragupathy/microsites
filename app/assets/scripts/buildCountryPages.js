// var rp = require('request-promise');
var fs = require('fs');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash');
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();

/*
 *  To get the list of centroids for open tasks:
 *    1) generate list of all unique tasks
 *    2) generate centroids for tasks with 'state' indicating they're 'in progress'
 *    3) reverse geocode those tasks to get countries
 *    4) group tasks by country
 *    5) ammend country page for each with tasks
 */

// Step 1
var tasksList = _.uniq(tasks.features.map((d) => { return d.properties.task; }));
// Step 2
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
  const taskNum = taskGeometries.features[0].properties.task;
  var taskStates = _.uniq(taskGeometries.features.map((s) => { return s.properties.state; }));
  taskStates = taskStates.filter((num) => {
    if (num > -1) { return num; }
  });
  if (taskStates.length > 0) {
    return turf.feature(
      turf.centroid(taskGeometries),
      { task: taskNum }
    );
  }
})
// Step 3
.then((taskCentroids) => {
  Promise.map(taskCentroids, (centroid) => {
    if (centroid !== undefined) {
      const coordinates = centroid.geometry.geometry.coordinates;
      const taskNum = centroid.properties.task;
      let country = crg.get_country(coordinates[1], coordinates[0]);
      country = Object.assign({ task: taskNum }, country);
      return country;
    }
  })
  .then((countries) => {
    const groupedCountries = _.groupBy(countries, (country) => {
      if (country !== undefined) {
        return country.code;
      }
    });
    return _.forEach(groupedCountries, (groupedCountry) => {
      if (groupedCountry !== undefined) {
        return groupedCountry;
      }
    });
  })
  .then((groupedCountries) => {
    console.log(groupedCountries);
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
