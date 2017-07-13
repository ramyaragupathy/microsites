'use strict';

var fs = require('fs');
var yamlFront = require('yaml-front-matter');
var _ = require('lodash');
var countryCodes = require('i18n-iso-countries');
var countries = JSON.parse(fs.readFileSync('countries.json'));

/* genCountryPage(countryPageInfo)
 *
 * writes page country specific w/ymf
 *
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
    'permalink: /' + countryName + '/',
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
  const yfmList = yamlFront.loadFront(countryPageMetaData);
  return yfmList.__content;
}
countries.forEach((country) => {
  if (!(country.code.match(/USA-/))) {
    genCountryPage(country);
  }
});
const allPageMetaData = [
  '---',
  'layout: all',
  'lang: en',
  'permalink: /all/',
  '---'
]
const allPage = './app/_country/all.md'
fs.writeFileSync(allPage, allPageMetaData.join('\n'))
