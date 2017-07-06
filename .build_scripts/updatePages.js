'use strict';

var fs = require('fs');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var currentFM = JSON.parse(fs.readFileSync('countryYFM.json').toString());
var currentTasks = JSON.parse(fs.readFileSync(argv._[0]).toString());
var countriesToUpdate = Object.keys(currentTasks);

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
    if (typeof yfmList === 'string') {
      yfmList = yfmList.split('\n');
    }
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

/* taskNormalizer(task)
 *
 * takes task json made in parseTasks and formats it to match what will exists
 * in the yaml front matter
 *
 */

function tasksNormalizer (task) {
  return [
    task.task,
    task.desc
  ];
}

function updateMarkdown (fmObj) {
  let fmListUpdated = [];
  _.forEach(fmObj, (v, k) => {
    let fmListEl;
    if (k === 'tm-projects') {
      fmListEl = [];
      fmListEl.push(k + ': ' + '\n');
      const tmProjects = v.map((tmProject) => {
        const id = '   - id: ' + tmProject[0].toString();
        const desc = '     desc: ' + tmProject[1];
        return [id, desc].join('\n');
      }).join('\n');
      fmListEl.push(tmProjects);
      fmListEl.join('\n');
      fmListEl = fmListEl[0] + fmListEl[1];
    } else {
      fmListEl = k + ': ' + v;
    }
    fmListUpdated.push(fmListEl);
  });
  fmListUpdated.unshift('---');
  fmListUpdated.push('---');
  return fmListUpdated.join('\n');
}

function updateFrontMatterObj (fmObj, updateObj) {
  // finding matching keys
  const fmObjKeys = Object.keys(fmObj);
  const updateObjKeys = Object.keys(updateObj);
  // union the values
  const sameKeys = _.intersection(fmObjKeys, updateObjKeys);
  sameKeys.forEach((sameKey) => {
    let fmObjVal;
    let updateObjVal;
    let unionedValues;
    if (sameKey === 'tm-projects') {
      fmObjVal = fmObj[sameKey];
      updateObjVal = updateObj[sameKey].map((task) => {
        return tasksNormalizer(task);
      });
      // some way to parse tm project stuff.
      unionedValues = _.union(fmObjVal, updateObjVal);
    } else {
      updateObjVal = updateObj[sameKey];
      fmObjVal = fmObj[sameKey];
      unionedValues = _.union(fmObjVal, updateObjVal);
    }
    // add this back to toUpdateCountries
    fmObj[sameKey] = unionedValues;
  });
  // write this back.
  return updateMarkdown(fmObj);
}

let countriesToUpdateFM = [];
countriesToUpdate.forEach((country) => {
  const countryFileName = 'app/_country/' + country + '.md';
  let fmList = fs.readFileSync(countryFileName).toString();
  fmList = fmList.split('\n');
  let fmObj = makeFrontMatterObj(fmList);
  countriesToUpdateFM.push(fmObj);
});
const countriesToUpdateFMObj = _.reduce(
  countriesToUpdateFM, (countriesToUpdateFMObj, countriesToUpdateFM) => {
    return _.assign(countriesToUpdateFMObj, countriesToUpdateFM);
  }, {}
);

_.forEach(countriesToUpdateFMObj, (countryFMObj, index) => {
  const countryFileName = 'app/_country/' + countriesToUpdateFMObj[index].code + '.md';
  console.log(countryFileName);
  const countryFMstring = updateFrontMatterObj(countryFMObj, currentTasks[index]);
  fs.writeFileSync(countryFileName, countryFMstring);
});
