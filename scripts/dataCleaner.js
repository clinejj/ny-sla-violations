const models = require('../models/');

// Follows format licenseId,latitude,longitude;
const updates = `
1180310,40.7417705,-73.9812603;
`;

const updatePremises = async () => {
  let premiseList = updates.split(';');
  for(let i=0;i<premiseList.length-1;i++) {
    let premiseParts = premiseList[i].split(',');
    if (premiseParts.length !== 3) {
      console.log(`Formatting issue on line ${i+1}`);
      continue;
    }
    let premise = await models.Premise.findByPk(premiseParts[0].trim());
    if (!premise) {
      console.log(`Could not find premise ${premiseParts[0].trim()}`);
      continue;
    }
    premise.latitude = premiseParts[1].trim();
    premise.longitude = premiseParts[2].trim();
    let premiseSave = await premise.save();
    if (i%10 == 0) {
      console.log(`${i}/${premiseList.length-1}`);
    }
  }
  return true;
};

(async () => {
  console.log(await updatePremises());
})();