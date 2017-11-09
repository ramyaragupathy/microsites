'use strict';

var fs = require('fs');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var currentUpdateObj = JSON.parse(fs.readFileSync(argv._[0]).toString());
var countriesToUpdate = Object.keys(currentUpdateObj);

/* makeFrontMatterObj(yfmList)
 *
 * returns json version of front matter
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
    'iso3: ',
    'iso2: ',
    'name: ',
    'admin: ',
    'contact: ',
    'flag: ',
    'osmLink: ',
    'calendar: ',
    'tm-projects: ',
    'bbox: ',
  ].map((fmKey) => {
    let fmObj = {};
    if (typeof yfmList === 'string') {
      yfmList = yfmList.split('\n');
    }
    /*
     * if the fmKey is tm-projects and there tasks are in the fm ( length < 12)
     * then make fmObj['tm-project'] a list of [id, desc] lists
     * in all other cases, just return back the values fm after the semicolon
     */
    let match;
    if (fmKey === 'tm-projects: ' && yfmList.length < 12) {
      const fmElStart = yfmList.indexOf(fmKey);
      const tasks = yfmList.slice(fmElStart + 1, yfmList.length - 2);
      match = existingTaskNormalizer(tasks);
      if (match[0]) {
        fmObj[fmKey.split(':')[0]] = match;
      }
    } else {
      match = yfmList.filter((fmEl) => {
        return fmEl.match(fmKey);
      });
      if (match[0]) {
        match = match[0].split(fmKey)[1];
      }
      fmObj[fmKey.split(':')[0]] = match;
    }
    return fmObj;
  });
  fmObjs = _.reduce(
    fmObjs, (fmObject, fm) => {
      return _.assign(fmObject, fm);
    }, {}
  );
  const fmObjFin = {};
  fmObjFin[fmObjs.code] = fmObjs;
  return fmObjFin;
}

/* taskNormalizer(task)
 *
 * takes task json made in parseTasks and formats it to match what will exists
 * in the yaml front matter
 *
 */

function updateTasksNormalizer (task) {
  return [
    task.task,
    task.desc.replace(/<p>/gm,'').replace(/<\/p>/gm, '')
  ];
}

/*  existingTaskNormalizer(tasks)
 *
 * for each [-id:###, -desc:words] sublist in tasks
 * grab the ### and words and push to tasksLists
 * then return that
 *
 */

function existingTaskNormalizer (tasks) {
  let tasksList = [];
  for (var i = 0; i < tasks.length - 1; i += 2) {
    let taskId;
    let taskDesc;
    if (i !== tasks.length - 1) {
      taskId = tasks[i].split('id: ')[1];
      taskDesc = tasks[i + 1].split('desc: ')[1];
      tasksList.push([taskId, taskDesc]);
    }
  }
  return tasksList;
}

/* updateMarkdown(fmObj)
 *
 * 1) Take country page fmobj with updates
 * 2) Generate a fmListEL, which matches the yam k:v found in the country.md
 * 3) return fmListUpdated, made up of fmListEls
 *
 */
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

/* updateFrontMatterObj(fmObj)
 *
 * 1) Take in both country page fmObj and updateObj
 * 2) update fmObj[samekey]'s value
 *  - if working with tasks, union existing and new tasks
 *  - if anything else, just update.
 * 3) return fmObj passed through updateMarkdown, which just maps fmObj to
 *    a yaml string that includes updates
 *
 */

function updateFrontMatterObj (fmObj, updateObj) {
  const fmObjKeys = Object.keys(fmObj);
  const updateObjKeys = Object.keys(updateObj);
  const sameKeys = _.intersection(fmObjKeys, updateObjKeys);
  sameKeys.forEach((sameKey) => {
    let fmObjVal;
    let updateObjVal;
    if (sameKey === 'tm-projects') {
      fmObjVal = fmObj[sameKey];
      updateObjVal = updateObj[sameKey].map((task) => {
        return updateTasksNormalizer(task);
      });
      const unionedValues = _.union(fmObjVal, updateObjVal);
      fmObj[sameKey] = unionedValues;
    } else {
      updateObjVal = updateObj[sameKey];
      fmObjVal = updateObjVal;
    }
  });
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
  const countryFMstring = updateFrontMatterObj(countryFMObj, currentUpdateObj[index]);
  fs.writeFileSync(countryFileName, countryFMstring);
});
