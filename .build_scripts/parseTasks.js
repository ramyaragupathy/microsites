'use stict'
var fs = require('fs');
var rp = require('request-promise');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync('tasks.geojson'));
var _ = require('lodash');
var md = require('node-markdown').Markdown;
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();

// WRITE JSON WITH HOTOSM TASKS GROUPED BY COUNTRY //

/* parseDesc(desc)
 *
 * 1) parse description parkdown, look only for paragraphs
 * 2) if not null, meaning a description exists:
 *    a) remove 'what missing maps is' paragraph found in some descriptions.
 *    b) get rid of undefined items in the list generated during markdown parse
 *    c) join items as a single string w/each item
 * 3) when null, return no description
 */
function parseDesc (desc) {
  desc = md(desc, true, 'p').match(/<p>(.*?)<\/p>/g);
  if (desc !== null) {
    desc = desc.map((p) => {
      if (!(p.match(/The Missing Maps project aims to map/))) {
        return p.replace(/<\/?p>/g, '');
      }
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
    let country;
    if (centroid !== undefined) {
      const coordinates = centroid.geometry.geometry.coordinates;
      const taskNum = centroid.properties.task;
      country = crg.get_country(coordinates[1], coordinates[0]);
      country = Object.assign({ task: taskNum }, country);
    }
    return country;
  }).then((countries) => {
    // remove undefined responses
    return _.difference(countries, [ undefined ]);
  }).then((validCountries) => {
    Promise.map(validCountries, (validCountry) => {
      const task = validCountry.task;
      return Promise.all([
        validCountry, rp('http://tasks.hotosm.org/project/' + task + '.json')
      ]);
    }).then((responses) => {
      let detailedTasks = responses.map((response) => {
        let desc;
        if (response[1] !== undefined) {
          desc = JSON.parse(response[1]).properties.short_description;
          desc = parseDesc(desc);
        } else {
          desc = '';
        }
        const country = response[0];
        country['desc'] = desc;
        return country;
      });
      detailedTasks = _.groupBy(detailedTasks, (detailedTask) => {
        return detailedTask.code;
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
      fs.writeFileSync('./countryTasks.json', JSON.stringify(detailedTasksFin));
    });
  }).catch((error) => {
    console.log(error);
  });
});
