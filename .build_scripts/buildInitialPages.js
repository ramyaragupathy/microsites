'use strict';

var fs = require('fs');
var fm = require('fm');
var countryCodes = require('i18n-iso-countries');
var countries = JSON.parse(fs.readFileSync('countries.json'));

/* genCountryPage(countryPageInfo)
 *   1) get parameters for generating page from countryPageInfo
 *   2) if tasks are included in countryPageInfo, include the metadat
 *   3) write this out to a file in /_country/
 */
function genCountryPage (countryPageInfo) {
  const countryName = countryPageInfo.name;
  const countryCode = countryPageInfo.code;
  const countryLink = countryPageInfo.link || 'https://openstreetmap.org';
  const countryPage = './app/_country/' + countryCode + '.md';
  const alpha2 = countryCodes.alpha3ToAlpha2(countryCode);
  let countryFlag;
  if (alpha2 !== undefined) {
    countryFlag = alpha2.toLowerCase();
  }
  let countryPageMetaData = [
    '---',
    'layout: country',
    'lang: en',
    'permalink: /microsites/' + countryName + '/',
    'code: ' + countryCode.toUpperCase(),
    'name: ' + countryName,
    'contact: ',
    'flag: ' + countryFlag + '.svg',
    'osmLink: ' + countryLink,
    'calendar: ',
    'tm-projects: ',
    '---'
  ];
  fs.writeFileSync(countryPage, countryPageMetaData.join('\n'));
  return fm(countryPageMetaData);
}

const countriesFM = [];
countries.forEach((country) => {
  countriesFM.push(genCountryPage(country));
});
console.log(countriesFM);

/* parseDesc(desc)
 *
 * 1) parse description parkdown, look only for paragraphs
 * 2) if not null, meaning a description exists:
 *    a) remove 'what missing maps is' paragraph found in some descriptions.
 *    b) get rid of undefined items in the list generated during markdown parse
 *    c) join items as a single string w/each item
 * 3) when null, return no description
 */
// function parseDesc (desc) {
//   desc = md(desc, true, 'p').match(/<p>(.*?)<\/p>/g);
//   if (desc !== null) {
//     desc = desc.map((p) => {
//       if (!(p.match(/The Missing Maps project aims to map/))) {
//         return p.replace(/<\/?p>/g, '');
//       }
//     }).filter((descItem) => {
//       if (descItem !== null) {
//         return descItem;
//       }
//     })
//     .join(' ')
//     .replace(/:/g, '.');
//   } else {
//     desc = '';
//   }
//   return desc;
// }

// return _.groupBy(countries, (country) => {
//   return country.code;
// });
// }).then((groupedTasks) => {
//     let validCodes = [];
//     _.forEach(validCountries, (validCountry) => {
//       let validCode = _.pick(validCountry, 'code');
//       validCodes.push(validCode.code);
//       const newValCountry = {};
//       const newValCountryKey = validCountry.code;
//       newValCountry[newValCountryKey] = validCountry.name;
//       return newValCountryKey;
//     });
//     Object.keys(groupedTasks).map((k, v) => {
//       if (_.includes(validCodes, k)) {
//         const matchIndex = validCodes.indexOf(k);
//         const newValCode = {};
//         const newValCodeKey = k;
//         newValCode[newValCodeKey] = groupedTasks[k];
//         validCountries[matchIndex] = newValCode;
//       }
//     });
//     validCountries = _.map(validCountries, (validCountry) => {
//       let newValCountry = {};
//       if (Object.keys(validCountry).length > 1) {
//         const newValCountryKey = validCountry.code;
//         const newValCountryObj = {};
//         newValCountryObj['code'] = validCountry.code;
//         newValCountryObj['name'] = validCountry.name;
//         newValCountryObj['osmLink'] = validCountry.link;
//         newValCountry[newValCountryKey] = newValCountryObj;
//         validCountry = newValCountry;
//       }
//
//       return validCountry;
//     });
//     return validCountries;
//   })
//   .then((validCountries) => {
//     validCountries = _.map(validCountries, (validCountry) => {
//       let validCountryVal = validCountry[Object.keys(validCountry)];
//       if (Array.isArray(validCountryVal)) {
//         Promise.map(validCountryVal, (valObj) => {
//           const task = valObj.task;
//           return Promise.all([
//             valObj,
//             rp('http://tasks.hotosm.org/project/' + task + '.json')
//           ]);
//         }).then((responses) => {
//           const osmLinks = JSON.parse(fs.readFileSync('countries.json'));
//           responses = responses.map((response) => {
//             const valObj = response[0];
//             let osmLink = osmLinks.filter((country) => {
//               return country.code === valObj.code;
//             })[0].link;
//             if (osmLink === undefined) {
//               osmLink = 'https://openstreetmap.org';
//             }
//             valObj['osmLink'] = osmLink;
//             const taskResponse = response[1];
//             let desc;
//             if (response[1]) {
//               desc = JSON.parse(taskResponse).properties.short_description;
//               desc = parseDesc(desc);
//             } else {
//               desc = '';
//             }
//             valObj['desc'] = desc;
//             return valObj;
//           });
//           responses = _.groupBy(responses, (response) => {
//             return response.code;
//           });
//           genCountryPage(responses);
//         }).catch((error) => {
//           console.log(error);
//         });
//       } else {
//         validCountryVal = _.groupBy([validCountryVal], (val) => {
//           return val.code;
//         });
//         genCountryPage(validCountryVal);
//       }
//     });
//   });
// });

// let tmProjects = [];
// if (countryPageInfo[0].task) {
//   countryPageInfo.forEach((infoObj) => {
//     const tmProject = [
//       '  - id: ' + infoObj.task,
//       '    desc: ' + infoObj.desc
//     ].join('\n');
//     tmProjects.push(tmProject);
//   });
//   countryPageMetaData.push(tmProjects.join('\n'));
// }
// countryPageMetaData.push('---');
