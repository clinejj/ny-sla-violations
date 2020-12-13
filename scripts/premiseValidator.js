const fs = require('fs');
const helpers = require('../util/helpers');
const models = require('../models');

const premiseValidater = async () => {
  let output = '';
  
  try {
    const violations = await models.Violation.findAll({ raw: true });
    
    let mismatches = 0;
    let notFound = 0;
    let checkedPremises = {};
    for (let i=0; i<violations.length; i++) {
      let entry = violations[i];
      
      if (checkedPremises[entry.licenseId]) {
        continue;
      }
      
      let city = entry.premiseCity;
      let county = entry.county;
      if (county.indexOf('RICH') != -1) {
        city = 'Staten Island';
      } else if (county.indexOf('NEW') != -1) {
        city = 'Manhattan';
      } else if (county.indexOf('QUEE') != -1) {
        city = 'Queens';
      } else if (county.indexOf('KING') != -1 ) {
        city = 'Brooklyn';
      } else if (county.indexOf('BRON') != -1) {
        city = 'Bronx';
      }
      let address = helpers.cleanAddress(entry.premiseAddress);
      let responseJSON = await helpers.geocodeAddress(address, city);
      
      if (!responseJSON.length) {
        output += '\n' +`Could not find premise for: ${entry.licenseId} - ${entry.chargeDate}`;
        output += '\n' +`Entry ${i+1}/${violations.length}`;
        notFound++;
        checkedPremises[entry.licenseId] = {};
        continue;
      }
      
      checkedPremises[entry.licenseId] = responseJSON[0];
      
      let mismatch = false;
      for (let j=0; j<responseJSON.length; j++) {
        let response = responseJSON[j];
        if (response && response.address) {
          let respAdd = response.address;
          if (respAdd.city && respAdd.city.toUpperCase() === city.toUpperCase()) {
            mismatch = false;
          } else {
            if (respAdd.suburb && respAdd.suburb.toUpperCase().indexOf(entry.county) >= 0) {
              mismatch = false
            } else if (respAdd.neighbourhood && respAdd.neighbourhood.toUpperCase().indexOf(entry.premiseCity.toUpperCase()) >= 0) {
              mismatch = false;
            } else if (respAdd.suburb && respAdd.suburb.toUpperCase().indexOf(entry.premiseCity.toUpperCase()) >= 0) {
              mismatch = false;
            } else if (respAdd.suburb && respAdd.suburb.toUpperCase() === 'MANHATTAN' && entry.premiseCity.toUpperCase() === 'NEW YORK') {
              mismatch = false;
            } else if (respAdd.village && respAdd.village.toUpperCase() === city.toUpperCase()) {
              mismatch = false;
            } else if (respAdd.county && respAdd.county.toUpperCase().indexOf(entry.county) >= 0) { 
              mismatch = false;
            } else if (response.display_name && response.display_name.indexOf(city) >= 0) {
              mismatch = false
            } else {
              mismatch = true;
            }
          }
          
          if (!mismatch) {
            break;
          }
        } else {
          output += '\n' + `No address for ${entry.licenseId} on response [${j}]`;
        }
      }
      
      if (mismatch) {
        let respAdd = responseJSON[0].address;
        output += '\n' + `Mismatch for ${entry.licenseId} - returned ${respAdd.city}-${respAdd.suburb}, expected ${city}-${entry.premiseCity}-${entry.county}`;
        output += '\n' + JSON.stringify(responseJSON[0]);
        mismatches++;
        output += '\n' + `Entry ${i+1}/${violations.length}`;
      }
      
      if (i%10 == 0) {
        console.log(`${i}/${violations.length-1}`);
      }
    }
    
    output += '\n' + `Total mismatches: ${mismatches}`;
    output += '\n' + `Total not found: ${notFound}`;
  } catch (error) {
    output += '\n' + error;
  } finally {
    return Promise.resolve(output)
  }
};

(async () => {
  let result = await premiseValidater();
  fs.writeFileSync(`/app/.data/validator_${Date.now()}.log`, result);
  console.log(result);
})();
