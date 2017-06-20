'use strict';

var rp = require('request-promise');
var fs = require('fs');
var Promise = require('bluebird');
var tasks = JSON.parse(fs.readFileSync('tasks.geojson'));
var countries = require('i18n-iso-countries');
var _ = require('lodash');
var turf = require('turf');
var crg = require('country-reverse-geocoding').country_reverse_geocoding();
var md = require('node-markdown').Markdown;
var validCountries = JSON.parse(fs.readFileSync('countries.json'));

 /* genCountryPage(countryPageInfo)
  *   1) get parameters for generating page from countryPageInfo
  *   2) if tasks are included in countryPageInfo, include the metadat
  *   3) write this out to a file in /_country/
  */
function genCountryPage (countryPageInfo) {
  countryPageInfo = countryPageInfo[Object.keys(countryPageInfo)];
  const countryName = countryPageInfo[0].name;
  const countryCode = countryPageInfo[0].code;
  const countryLink = countryPageInfo[0].osmLink || 'https://openstreetmap.org';
  const countryPage = './app/_country/' + countryCode + '.md';
  const alpha2 = countries.alpha3ToAlpha2(countryPageInfo[0].code);
  let countryFlag;
  if (alpha2 !== undefined) {
    countryFlag = alpha2.toLowerCase();
  }
  let countryPageMetaData = [
    '---',
    'layout: country',
    'lang: en',
    'permalink: /' + countryName + '/',
    'id: ' + countryCode.toLowerCase(),
    'name: ' + countryName,
    'contact: ',
    'flag: ' + countryFlag + '.svg',
    'calendar: ',
    'updates: ',
    '  - title: ',
    '    author: ',
    '    date: ',
    '    content: ',
    '    osmLink: ' + countryLink,
    '    link: ',
    '    linktext:',
    'tm-projects: '
  ];
  let tmProjects = [];
  if (countryPageInfo[0].task) {
    countryPageInfo.forEach((infoObj) => {
      const tmProject = [
        '  - id: ' + infoObj.task,
        '    desc: ' + infoObj.desc
      ].join('\n');
      tmProjects.push(tmProject);
    });
    countryPageMetaData.push(tmProjects.join('\n'));
  }
  countryPageMetaData.push('---');
  console.log(countryPageMetaData);
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

/*
 *  To get the list of centroids for open tasks:
 *    1) generate lists of all unique tasks & valid country objects
 *    2) generate centroids for ongoing tasks
 *    3) reverse geocode those tasks to get countries
 *    4) group tasks by country
 *    5) check reverse geocoded code against osm-stats code
 *    6) generate pages
 */
var tasksList = _.uniq(tasks.features.map((d) => { return d.properties.task; }));

validCountries = _.filter(validCountries, (validCountry) => {
  if (!validCountry.code.match('USA-')) {
    return validCountry.code;
  }
});

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
  }).then((countries) => {
    countries = _.filter(countries, (country) => {
      if (country !== null || Object.keys(country) !== null) {
        return country;
      }
    });
    return _.groupBy(countries, (country) => {
      return country.code;
    });
  }).then((groupedTasks) => {
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
        newValCountryObj['osmLink'] = validCountry.link;
        newValCountry[newValCountryKey] = newValCountryObj;
        validCountry = newValCountry;
      }

      return validCountry;
    });
    return validCountries;
  })
  .then((validCountries) => {
    validCountries = _.map(validCountries, (validCountry) => {
      let validCountryVal = validCountry[Object.keys(validCountry)];
      if (Array.isArray(validCountryVal)) {
        Promise.map(validCountryVal, (valObj) => {
          const task = valObj.task;
          return Promise.all([
            valObj,
            rp('http://tasks.hotosm.org/project/' + task + '.json')
          ]);
        }).then((responses) => {
          const osmLinks = JSON.parse(fs.readFileSync('countries.json'));
          responses = responses.map((response) => {
            const valObj = response[0];
            let osmLink = osmLinks.filter((country) => {
              return country.code === valObj.code;
            })[0].link;
            if (osmLink === undefined) {
              osmLink = 'https://openstreetmap.org';
            }
            valObj['osmLink'] = osmLink;
            const taskResponse = response[1];
            let desc;
            if (response[1]) {
              desc = JSON.parse(taskResponse).properties.short_description;
              desc = parseDesc(desc);
            } else {
              desc = '';
            }
            valObj['desc'] = desc;
            return valObj;
          });
          responses = _.groupBy(responses, (response) => {
            return response.code;
          });
          genCountryPage(responses);
        }).catch((error) => {
          console.log(error);
        });
      } else {
        validCountryVal = _.groupBy([validCountryVal], (val) => {
          return val.code;
        });
        genCountryPage(validCountryVal);
      }
    });
  });
});
