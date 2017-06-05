var rp = require('request-promise');
var fs = require('fs')
/* -------------------------------------------------------
 ----------- Get List of Country Names from api ---------
 -------------------------------------------------------*/

// const options = {uri:'http://osmstats.redcross.org/countries',json:true}
const options = {uri:'http://localhost:3000/countries',json: true}

/*
  With forEach, the following steps make country files for each country
    1) make a file {country}.md with writeFileSync
    2) append each line of metadata as defined in the country-example.md file
*/
rp(options)
.then(function(results){
  results.forEach((country) => {
    const countryFile = '../../_country/' + country + '.md'
    fs.writeFileSync(countryFile, '---')
    fs.appendFileSync(countryFile, '\n')
    fs.appendFileSync(countryFile, 'layout: country \n')
    fs.appendFileSync(countryFile, 'lang: en \n')
    fs.appendFileSync(countryFile, 'permalink: /' + country + '/ \n')
    fs.appendFileSync(countryFile, 'name: ' + country + '\n')
    fs.appendFileSync(countryFile, 'tm-projects: \n')
    fs.appendFileSync(countryFile, '---')
  })
})
