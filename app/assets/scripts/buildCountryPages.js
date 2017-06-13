var rp = require('request-promise');
var fs = require('fs');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash');
var omitBy = require('lodash.omitby');
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();

/*
 *  To get the list of centroids for open tasks:
 *    1) generate list of all unique tasks
 *    2) generate centroids for tasks with 'state' indicating they're 'in progress'
 *    3) reverse geocode those tasks to get countries
 *    4) group tasks by country
 *    5) check reverse geocoded code against osm-stats code
 *    6) ammend country page for each with tasks
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
  // Step 4
  .then((countries) => {
    countries = _.filter(countries, (country) => {
      if (country !== null || Object.keys(country) !== null) {
        return country;
      }
    });
    return _.groupBy(countries, (country) => {
      return country.code;
    });
  })
  // Step 5
  .then((groupedTasks) => {
    let validCountries = JSON.parse(
      fs.readFileSync('./countries.json')
    );
    validCountries = _.filter(validCountries.countries, (validCountry) => {
      if (!validCountry.code.match('USA-')) {
        return validCountry.code;
      }
    });
    const validCodes = [];
    _.forEach(validCountries, (validCountry) => {
      let validCode = _.pick(validCountry, 'code');
      validCodes.push(validCode.code);
    });
    const groupedTasksFin = [];
    Object.keys(groupedTasks).map((k, v) => {
      if (_.includes(validCodes, k)) {
        const taskGroup = {};
        taskGroup[k] = groupedTasks[k];
        groupedTasksFin.push(taskGroup);
      }
    });
    // Step 6
    Promise.map(groupedTasksFin, (finTaskGroup) => {
      const countryFile = '../../_country/' + Object.keys(finTaskGroup);
      const countryName = finTaskGroup[Object.keys(finTaskGroup)][0].name;
      fs.writeFileSync(countryFile, '---');
      fs.appendFileSync(countryFile, '\n');
      fs.appendFileSync(countryFile, 'layout: country \n');
      fs.appendFileSync(countryFile, 'permalink: /' + countryName + '/ \n');
      fs.appendFileSync(countryFile, 'name: ' + countryName + '\n');
      fs.appendFileSync(countryFile, 'lang: en \n');
      fs.appendFileSync(countryFile, 'tm-projects: \n');
      finTaskGroup[Object.keys(finTaskGroup)].map((task) => {
        const taskNum = task.task;
        fs.appendFileSync(countryFile, ' - id: ' + taskNum + '\n');
        rp('tasks.hotosm.org/project/' + taskNum + '.json')
        .then((project) => {
          const desc = project.properties.description;
          fs.appendFileSync(countryFile, 'desc: ' + desc);
        });
      });
    });
  });
});
