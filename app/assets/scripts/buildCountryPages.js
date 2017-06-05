var rp = require('request-promise');
var fs = require('fs')
var Promise = require('bluebird')
var tasks = JSON.parse(fs.readFileSync(
  '../../../../../helpers/osm-data-parse/tasking-mgr-projects/output/output_20170605-122008.geojson'
));
var _ = require('lodash')
/* -------------------------------------------------------
 ----------- Get List of Country Names from api ---------
 -------------------------------------------------------*/

// const options = {uri:'http://osmstats.redcross.org/countries',json:true}
const options = {uri:'http://localhost:3000/countries',json: true}

// get unique tasks
var tasksList = _.uniq(tasks.features.map((d) => {return d.properties.task}))
// create list of 'subFeature' collections for each task #.
// effectively creating list of tasks, where each el is equivalent to all task features
var groupedTasks = []
for(i=0;i<tasksList.length;i++){
  console.log(tasks)
  // taskGeometries = tasks.features.reduce((f) => {
  //   if(f.properties.task === tasksList[i]) {return f}
  // })
  // groupedTasks.push(taskGeometries)
}


/*
  With forEach, the following steps make country files for each country
    1) make a file {country}.md with writeFileSync
    2) append each line of metadata as defined in the country-example.md file
*/
rp(options)
.then(function(results){
  results.forEach((country) => {
    // generate api call to boundaries
    const geojsonOptions = {
      uri:'https://raw.githubusercontent.com/AshKyd/geojson-regions/master/countries/10m/' + country[1] + '.geojson',
      json:true
    }
    rp(geojsonOptions)
    .then(function(geojsonResults) {
      console.log(geojsonResults)
    })
    .catch(function(error) {
      console.log('an error')
    })
    // const countryFile = '../../_country/' + country[0] + '.md'
    // fs.writeFileSync(countryFile, '---')
    // fs.appendFileSync(countryFile, '\n')
    // fs.appendFileSync(countryFile, 'layout: country \n')
    // fs.appendFileSync(countryFile, 'lang: en \n')
    // fs.appendFileSync(countryFile, 'permalink: /' + country + '/ \n')
    // fs.appendFileSync(countryFile, 'name: ' + country + '\n')
    // fs.appendFileSync(countryFile, 'tm-projects: \n')
    // fs.appendFileSync(countryFile, '---')
  })
})
