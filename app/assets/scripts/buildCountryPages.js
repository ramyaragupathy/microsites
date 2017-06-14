'use strict';

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
  const countryName = countryPageInfo.name;
  const countryCode = countryPageInfo.code;
  const countryPage = '../../_country/' + countryCode + '.md';
  const countryFlag = countryCode.substr(0, 2).toLowerCase();
  let countryPageMetaData = [
    '---',
    'layout: country',
    'lang: en',
    'permalink: /' + countryName + '/',
    'id: ' + countryCode.toLowerCase(),
    'name: ' + countryName,
    'flag: ' + countryFlag + '.svg',
    'calendar: ',
    'tm-projects: '
  ];
  if (countryPageInfo.desc) {
    const tmProjects = [
      '  - id: ' + countryPageInfo.task,
      '    desc: ' + countryPageInfo.desc
    ].join('\n');
    countryPageMetaData.push(tmProjects);
  }
  countryPageMetaData.push('---');
  fs.writeFileSync(countryPage, countryPageMetaData.join('\n'));
}

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
    })
    .join(' ')
    .replace(/:/g, '.');
  } else {
    desc = '';
  }
  return desc;
}

// Step 1
var tasksList = _.uniq(tasks.features.map((d) => { return d.properties.task; }));
var validCountries = JSON.parse(
  fs.readFileSync('./countries.json')
);
validCountries = _.filter(validCountries.countries, (validCountry) => {
  if (!validCountry.code.match('USA-')) {
    return validCountry.code;
  }
});
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
    let validCodes = [];
    _.forEach(validCountries, (validCountry) => {
      let validCode = _.pick(validCountry, 'code');
      validCodes.push(validCode.code);
      const newValCountry = {};
      const newValCountryKey = validCountry.code;
      newValCountry[newValCountryKey] = validCountry.name;
      return newValCountryKey;
    });
    Object.keys(groupedTasks).map((k, v) => {
      if (_.includes(validCodes, k)) {
        const matchIndex = validCodes.indexOf(k);
        const newValCode = {};
        const newValCodeKey = k;
        newValCode[newValCodeKey] = groupedTasks[k];
        validCountries[matchIndex] = newValCode;
      }
    });
    validCountries = _.map(validCountries, (validCountry) => {
      let newValCountry = {};
      if (Object.keys(validCountry).length > 1) {
        const newValCountryKey = validCountry.code;
        const newValCountryObj = {};
        newValCountryObj['code'] = validCountry.code;
        newValCountryObj['name'] = validCountry.name;
        newValCountry[newValCountryKey] = newValCountryObj;
        validCountry = newValCountry;
      }
      return validCountry;
    });
    return validCountries;
  })
  .then((validCountries) => {
    validCountries = _.map(validCountries, (validCountry) => {
      const validCountryVal = validCountry[Object.keys(validCountry)];
      if (Array.isArray(validCountryVal)) {
        Promise.map(validCountryVal, (valObj) => {
          const task = valObj.task;
          return Promise.all([
            valObj,
            rp('http://tasks.hotosm.org/project/' + task + '.json')
          ]);
        })
        .then((responses) => {
          responses.forEach((response) => {
            const valObj = response[0];
            let desc;
            if (response[1]) {
              desc = JSON.parse(response[1]).properties.short_description;
              desc = parseDesc(desc);
            } else {
              desc = '';
            }
            valObj['desc'] = desc;
            genCountryPage(valObj);
          });
        })
        .catch((error) => {
          console.log(error);
        });
      } else {
        genCountryPage(validCountryVal);
      }
    });
  });
});
