var rp = require('request-promise');
var fs = require('fs');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash');
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var md = require('node-markdown').Markdown;

/*
 *  To get the list of centroids for open tasks:
 *    1) generate list of all unique tasks
 *    2) generate centroids for tasks with 'state' indicating they're 'in progress'
 *    3) reverse geocode those tasks to get countries
 *    4) group tasks by country
 *    5) check reverse geocoded code against osm-stats code
 *    6) generate pages for all country without tasks
 *    7) generate country page for each with tasks
 */

function genCountryPage (countryPageInfo) {
  // 4th element holds list of task, so if it
  if (!(countryPageInfo[4])) {
    fs.writeFileSync(countryPageInfo[0], '---');
    fs.appendFileSync(countryPageInfo[0], '\n');
    fs.appendFileSync(countryPageInfo[0], 'layout: country \n');
    fs.appendFileSync(countryPageInfo[0], 'permalink: /' + countryPageInfo[1] + '/ \n');
    fs.appendFileSync(countryPageInfo[0], 'code: ' + countryPageInfo[2] + '\n');
    fs.appendFileSync(countryPageInfo[0], 'name: ' + countryPageInfo[1] + '\n');
    fs.appendFileSync(countryPageInfo[0], 'lang: en \n');
    fs.appendFileSync(countryPageInfo[0], 'flag: ' + countryPageInfo[3] + '\n');
    fs.appendFileSync(countryPageInfo[0], 'tm-projects: \n');
  } else {
    countryPageInfo[4].map((task) => {
      console.log(task);
      const taskNum = task.task;
      const promiseIterable = [
        rp('http://tasks.hotosm.org/project/' + taskNum + '.json'),
        countryPageInfo[0],
        taskNum
      ];
      Promise.all(promiseIterable)
      .then((result) => {
        let desc = md(
          JSON.parse(result[0]).properties.description,
          true,
          'p'
        ).match(/<p>(.*?)<\/p>/g).map((p) => {
          if (!(p.match(/The Missing Maps project aims to map/))) {
            return p.replace(/<\/?p>/g, '');
          }
        });
        console.log(desc);
        fs.appendFileSync(result[1], ' - id: ' + result[2] + '\n');
        fs.appendFileSync(result[1], '   desc: ' + desc.join('\n') + '\n');
      });
    });
  }
}

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
    Promise.map(validCountries, (validCountry) => {
      const countryCode = validCountry.code;
      const countryFile = '../../_country/' + countryCode + '.md';
      const countryName = validCountry.name;
      const countryFlag = countryCode.slice(0, 2).toLowerCase() + '.svg';
      genCountryPage([
        countryFile, countryName, countryCode, countryFlag
      ]);
      return countryName;
    })
    .then((countryNames) => {
      countryNames.forEach((countryName) => {
        console.log('Generated microsite page for ' + countryName + '...');
      });
    });
    // Step 7
    Promise.map(groupedTasksFin, (finTaskGroup) => {
      const countryFile = '../../_country/' + Object.keys(finTaskGroup) + '.md';
      const countryName = finTaskGroup[Object.keys(finTaskGroup)][0].name;
      const countryCode = Object.keys(finTaskGroup)[0];
      const countryFlag = countryCode.slice(0, 2).toLowerCase() + '.svg';
      const countryTask = finTaskGroup[Object.keys(finTaskGroup)];
      genCountryPage([
        countryFile, countryName, countryCode, countryFlag, countryTask
      ]);
      return countryName;
    })
    .then((countryNames) => {
      countryNames.forEach((countryName) => {
        console.log('Generated microsite page for ' + countryName + '...');
      });
    });
  });
});
