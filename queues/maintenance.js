const cheerio = require('cheerio');
const fetch = require('node-fetch');
const helpers = require('../util/helpers');
const models = require('../models');
const xlsx = require('xlsx');

const keepAlive = async (job) => {
  try {
    let response = await fetch(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    let date = new Date();
    let timeString = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    job.progress(100);
    return Promise.resolve(timeString);
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};

const updateData = async (job) => {
  let status = '';
  let success = false;
  let fileDate = null;
  let filePath = null;
  try {
    // Steps
    // 1. Check for file
    const date = new Date();
    const paddedMonth = ('0' + (date.getMonth() + 1)).slice(-2);
    const shortYear = ('' + date.getFullYear()).slice(-2);
    let fileURL = `https://sla.ny.gov/system/files/documents/${date.getFullYear()}/${paddedMonth}/sla-eo-summary-and-charges-tracker-${date.getMonth()+1}_${date.getDate()}_${shortYear}_updated-summary_0.xlsx`;

    let response = await fetch(fileURL);
    if (response.status === 404) {
      // 1b. if not, check for redirect URL in source and try that (just once)
      let bodyText = await response.text();
      const $ = cheerio.load(bodyText);

      fileURL = $('a', $('h5').siblings()[0]).text().trim();

      if (!fileURL || fileURL.indexOf('http') !== 0) {
        throw 'No linked file on redirect page';
      }

      response = await fetch(fileURL);
      if (!response.ok) {
        throw 'Could not download after redirect';
      }
    } else if (!response.ok) {
      throw 'Did not receive successful file';
    }

    // Check to see if we already processed this URL
    const lastSuccessUpdate = await models.Update.findOne({ 
      where: { success: true },
      order: [['counter', 'DESC']]
    });
    if (lastSuccessUpdate.fileUrl === fileURL) {
      success = true;
      status = 'Success, already processed latest URL';
      fileDate = helpers.dateFromUrl(fileURL);
      filePath = fileURL;
      return Promise.resolve(status);
    }

    let respData = await response.buffer();

    // 2. parse XLSX
    const workbook = xlsx.read(respData, { type:'buffer' });
    const charges = workbook.Sheets['Charges'];
    const suspensions = workbook.Sheets['Summary Suspensions'];

    if (!charges || !suspensions) {
      throw 'Did not find expected workbook sheet names';
    }

    // 3. dump data to DB

    let charges_json = xlsx.utils.sheet_to_json(charges, { raw: false });
    let suspensions_json = xlsx.utils.sheet_to_json(suspensions, { raw: false });

    let job_progress = 0;
    let job_total = charges_json.length + suspensions_json.length;

    // 3a. write each charge
    for(let i=0; i<charges_json.length; i++) {
      let entry = charges_json[i];
      let chargeDate = new Date(entry['charge_date'].trim());
      const violCreate = await models.Violation.findOrCreate({
        where: {
          licenseId: entry['lic_ser_num'].trim(),
          chargeDate: chargeDate
        },
        defaults: {
          county: entry['county'].trim(),
          licenseType: entry['lic_type'].trim(),
          premiseName: entry['premise_name'].trim(),
          premiseCity: entry['premise_city'].trim(),
          premiseAddress: entry['premise_address'].trim(),
          violationDescription: entry['viol_desc'].trim()
        }
      });

      let violation = violCreate[0];

      // 3ab. add premise if doesn't exist (with reverse geo lookup)
      let premiseFind = await models.Premise.findOrCreate({
        where: {
          licenseId: entry['lic_ser_num'].trim()
        },
        defaults: {
          name: entry['premise_name'].trim(),
          city: entry['premise_city'].trim(),
          address: entry['premise_address'].trim()
        }
      });
      let premise = premiseFind[0];
      if (premiseFind[1] || !premise.latitude || !premise.longitude) {
        let city = entry['premise_city'].trim();
        let county = entry['county'].trim();
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
        let address = helpers.cleanAddress(entry['premise_address'].trim());
        let responseJSON = await helpers.geocodeAddress(address, city);

        if (responseJSON.length) {
          let matchedResponse = helpers.findPremiseMatch(entry, city, responseJSON);
          if (matchedResponse && matchedResponse.lat && matchedResponse.lon) {
            premise.latitude = responseJSON[0].lat;
            premise.longitude = responseJSON[0].lon;
            premise = await premise.save();
          } else {
            console.log(`Did not find match for ID ${entry['lic_ser_num']}: `);
            console.log(entry);
          }
        } else {
          console.log(`Could not lookup premise for ID ${entry['lic_ser_num']}: `);
          console.log(entry);
        }
      }

      job_progress++;
      job.progress(job_progress/job_total*100);
    };

    // 4. write suspensions
    for (let i=0; i<suspensions_json.length; i++) {
      const entry = suspensions_json[i];

      let dateSplit = entry['Date Imposed'].trim().split('/');
      let dateImposed = new Date(parseInt('20' + dateSplit[2]), parseInt(dateSplit[0]) - 1, parseInt(dateSplit[1]));
      const suspCreate = await models.Suspension.findOrCreate({
        where: {
          licenseId: entry['Serial #'].trim()
        },
        defaults: {
          name: entry['Licensee Name'].trim(),
          county: entry['County'].trim(),
          status: entry['Status'].trim(),
          suspended: entry['Status'].trim().toLowerCase().indexOf('in effect') > -1,
          dateImposed: dateImposed
        }
      });
      let susp = suspCreate[0];
      if (!suspCreate[1]) {
        susp.name = entry['Licensee Name'].trim();
        susp.county = entry['County'].trim();
        susp.status = entry['Status'].trim();
        susp.suspended = entry['Status'].trim().toLowerCase().indexOf('in effect') > -1;
        susp.dateImposed = dateImposed;
        susp = await susp.save();
      }

      // TODO: handle if premise doesn't exist in premise DB?

      job_progress++;
      job.progress(job_progress/job_total*100);
    };


    status = status === '' ? 'Success' : status;
    success = true;
    fileDate = helpers.dateFromUrl(fileURL);
    filePath = fileURL;
    job.progress(100);
    return Promise.resolve(status);
  } catch (error) {
    status = error;
    console.error(error);
    return Promise.reject(error);
  } finally {
    const updateCreate = await models.Update.create({
      status: status,
      success: success,
      fileDate: fileDate,
      fileUrl: filePath
    });
  }
};

module.exports = {
  keepAlive: keepAlive,
  updateData: updateData
}
