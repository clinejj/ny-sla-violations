const helpers = require('../util/helpers');

module.exports = (app) => {

  app.get('/', async (req, res) => {
    let premiseLookup = {};
    let premiseData = [];
    let lastUpdateData = {};

    // fetch all premises, put in license -> premise map
    const premises = await app.get('models').Premise.findAll({ raw: true });
    for (let i=0; i<premises.length; i++) {
      let premise = premises[i];
      premiseData.push({
        licenseId: premise.licenseId,
        name: premise.name,
        city: premise.city,
        address: premise.address,
        lat: premise.latitude,
        lon: premise.longitude,
        violations: [],
        suspension: {}
      });
      premiseLookup[premise.licenseId] = i;
    }

    // fetch all suspensions, put in license -> suspension map
    const suspensions = await app.get('models').Suspension.findAll({ raw: true });
    suspensions.forEach(suspension => {
      let index = premiseLookup[suspension.licenseId];
      if (index !== undefined) {
        let suspData = {
          suspended: suspension.suspended,
          status: suspension.status,
          dateImposed: suspension.dateImposed
        }
        premiseData[index].suspension = suspData;
        premiseData[index]['county'] = suspension.county;
      }
    });

    // fetch all violations, put in license -> [violations] map
    const violations = await app.get('models').Violation.findAll({ raw: true });
    violations.forEach(viol => {
      let index = premiseLookup[viol.licenseId];
      if (index !== undefined) {
        let violData = {
          chargeDate: viol.chargeDate,
          description: viol.violationDescription
        }
        premiseData[index].violations.push(violData);
        premiseData[index]['licenseType'] = viol.licenseType;
      }
    });

    // fetch last successful and unsuccessful update, store data
    const lastSuccessUpdate = await app.get('models').Update.findOne({ 
      where: { success: true },
      order: [['counter', 'DESC']]
    });
    const lastUpdate = await app.get('models').Update.findOne({
      order: [['counter', 'DESC']]
    });
    lastUpdateData = {
      successFileUrl: lastSuccessUpdate.fileUrl,
      successFileDate: lastSuccessUpdate.fileDate,
      successDate: lastSuccessUpdate.createdAt,
      mostRecentDate: lastUpdate.createdAt
    };

    res.render('index', { premiseData: premiseData, lastUpdate: lastUpdateData });
  });
};
