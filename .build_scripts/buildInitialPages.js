'use strict';

var fs = require('fs');
var yamlFront = require('yaml-front-matter');
var _ = require('lodash');
const countries = require('../countries.json');

/* genCountryPage(countryPageInfo)
*
* writes page country specific w/ymf
*
*   1) get parameters for generating page from countryPageInfo
*   2) if tasks are included in countryPageInfo, include the metadata
*   3) write this out to a file in /_country/
*/
// console.log(countries);

function genCountryPage (countryPageInfo) {
  // console.log(countryPageInfo);

  const countryPage = './app/_country/' + countryPageInfo.iso3 + '.md';
  let countryPageMetaData = [
    '---',
    'layout: country',
    'lang: en',
    'permalink: /' + countryPageInfo.admin.toLowerCase() + '/',
    'iso3: ' + countryPageInfo.iso3.toUpperCase(),
    'iso2: ' + countryPageInfo.iso2.toUpperCase(),
    'name: ' + countryPageInfo.name,
    'admin: ' + countryPageInfo.admin,
    'contact: ',
    'flag: ' + countryPageInfo.iso2.toLowerCase() + '.svg',
    'osmLink: ' + countryPageInfo.osm_link,
    'calendar: ',
    'tm-projects: ',
    'bbox: ' + countryPageInfo.bbox,
    '---'
  ];
  fs.writeFileSync(countryPage, countryPageMetaData.join('\n'));
  const yfmList = yamlFront.loadFront(countryPageMetaData);
  return yfmList.__content;
}
countries.forEach(
  function(country){
    if (country.iso3 != '-99') {
      genCountryPage(country);
    } else {
      console.log(country.admin);
    }
  }
);

const allPageMetaData = [
  '---',
  'layout: all',
  'lang: en',
  'permalink: /all/',
  '---'
]
const allPage = './app/_country/all.md'
fs.writeFileSync(allPage, allPageMetaData.join('\n'))
