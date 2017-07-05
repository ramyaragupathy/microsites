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
  const yfmList = yamlFront.loadFront(countryPageMetaData);
  return yfmList.__content;
}

/* makeFrontMatterObj(yfmList)
 *
 * returns json v. of front matter
 *
 * 1) map values for fm keys by filtering yfmList for where fmKey regex matches
 * 2) take the list of objects generated and make singe object
 *
 */
function makeFrontMatterObj (yfmList) {
  let fmObjs = [
    'layout: ',
    'lang: ',
    'permalink: ',
    'code: ',
    'name: ',
    'contact: ',
    'flag: ',
    'osmLink: ',
    'calendar: ',
    'tm-projects: '
  ].map((fmKey) => {
    let fmObj = {};
    let match = yfmList.filter((fmEl) => {
      return fmEl.match(fmKey);
    });
    if (match[0]) {
      match = match[0].split(fmKey)[1];
    }
    fmObj[fmKey.split(':')[0]] = match;
    return fmObj;
  });
  fmObjs = _.reduce(
    fmObjs, (fmObject, fm) => {
      return _.assign(fmObject, fm);
    }, {}
  );
  const fmObj = {};
  fmObj[fmObjs.code] = fmObjs;
  return fmObj;
}

let countriesFM = [];
countries.forEach((country) => {
  if (!country.code.match(/USA-/)) {
    const yfmList = genCountryPage(country).split(',');
    let yfmObj = makeFrontMatterObj(yfmList);
    countriesFM.push(yfmObj);
  }
});

const countriesFMObj = _.reduce(
  countriesFM, (countriesFMOObj, countriesFM) => {
    return _.assign(countriesFMOObj, countriesFM);
  }, {}
);

fs.writeFileSync('./countryYFM.json', JSON.stringify(countriesFMObj));
