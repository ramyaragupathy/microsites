var fs = require('fs');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync('tasks.geojson'));
var _ = require('lodash');
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();

 // WRITE JSON WITH HOTOSM TASKS GROUPED BY COUNTRY //

/*
 * 1) generate list of unique tasks + their geometry
 * 2) find w/in that list centroids of ongoing tasks
 * 3) reverse geocode those tasks to get country names
 * 4) group tasks by countries in a json
 * 5) write that json to file
 */

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
}).then((taskCentroids) => {
  Promise.map(taskCentroids, (centroid) => {
    if (centroid !== undefined) {
      const coordinates = centroid.geometry.geometry.coordinates;
      const taskNum = centroid.properties.task;
      let country = crg.get_country(coordinates[1], coordinates[0]);
      country = Object.assign({ task: taskNum }, country);
      return country;
    }
  }).then((countries) => {
    countries = _.filter(countries, (country) => {
      if (country !== null || Object.keys(country) !== null) {
        return country;
      }
    });
    return _.groupBy(countries, (country) => {
      return country.code;
    });
  }).then((groupedCountries) => {
    fs.writeFileSync('./countryTasks.json', JSON.stringify(groupedCountries));
  });
});
