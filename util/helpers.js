const fetch = require('node-fetch');

const dateFromUrl = (url) => {
  const hyphenSplit = url.split('-');
  let underSplit = [];
  for( let i=0; i < hyphenSplit.length; i++) {
    underSplit = hyphenSplit[i].split('_');
    if (underSplit[2] && (underSplit[2] === '20' || underSplit[2] === '21')) {
      break;
    }
  };

  return new Date(parseInt('20' + underSplit[2]), parseInt(underSplit[0]) - 1, parseInt(underSplit[1]));
};

const cleanAddress = (address) => {
  let cleanedAddress = address.split(' AKA')[0];
  cleanedAddress = cleanedAddress.split(' A/K/A')[0];
  cleanedAddress = cleanedAddress.split(' UNIT')[0];
  cleanedAddress = cleanedAddress.split('#')[0];
  cleanedAddress = cleanedAddress.split(' PO')[0];
  cleanedAddress = cleanedAddress.split(' T/O')[0];
  cleanedAddress = cleanedAddress.split(' - ')[0];
  cleanedAddress = cleanedAddress.split(' SUITE')[0];
  cleanedAddress = cleanedAddress.split(' STE')[0];
  cleanedAddress = cleanedAddress.split('- W')[0];
  cleanedAddress = cleanedAddress.split(' 1ST FL')[0];
  cleanedAddress = cleanedAddress.split(' STORE')[0];
  return cleanedAddress;
};

const geocodeAddress = async (address, city) => {
  let responseJSON = [];

  try {
    let geoURL = encodeURI(`https://nominatim.openstreetmap.org/search?street=${address}&city=${city}&state=NY&country=USA&addressdetails=1&format=json`);
    let geoResponse = await fetch(geoURL, { headers: { 'Referer': `${process.env.PROJECT_DOMAIN}.glitch.me` }});
    if (geoResponse.ok) {
      responseJSON = await geoResponse.json();
      if (!responseJSON[0] || !responseJSON[0].lat || !responseJSON[0].lon) {
        // try address trick for multiple building #s listed before street name
        let address_split = address.split(' ');
        if (address_split.length > 2 && !isNaN(address_split[1]) && isNaN(address_split[2])) {
          address_split.splice(1, 1);
        }
        address = address_split.join(' ');
        geoURL = encodeURI(`https://nominatim.openstreetmap.org/search?street=${address}&city=${city}&state=NY&country=USA&addressdetails=1&format=json`);
        geoResponse = await fetch(geoURL, { headers: { 'Referer': `${process.env.PROJECT_DOMAIN}.glitch.me` }});
        if (geoResponse.ok) {
          responseJSON = await geoResponse.json();
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return responseJSON;
};

const findPremiseMatch = (entry, modifiedCity, responses) => {
  let mismatch = false;
  let entryCity = entry['premise_city'].trim();
  let county = entry['county'].trim();

  for (let j=0; j<responses.length; j++) {
    let response = responses[j];
    if (response && response.address) {
      let respAdd = response.address;
      if (respAdd.city && respAdd.city.toUpperCase() === modifiedCity.toUpperCase()) {
        mismatch = false;
      } else {
        if (respAdd.suburb && respAdd.suburb.toUpperCase().indexOf(county) >= 0) {
          mismatch = false
        } else if (respAdd.neighbourhood && respAdd.neighbourhood.toUpperCase().indexOf(entryCity.toUpperCase()) >= 0) {
          mismatch = false;
        } else if (respAdd.suburb && respAdd.suburb.toUpperCase().indexOf(entryCity.toUpperCase()) >= 0) {
          mismatch = false;
        } else if (respAdd.suburb && respAdd.suburb.toUpperCase() === 'MANHATTAN' && entryCity.toUpperCase() === 'NEW YORK') {
          mismatch = false;
        } else if (respAdd.village && respAdd.village.toUpperCase() === modifiedCity.toUpperCase()) {
          mismatch = false;
        } else if (respAdd.county && respAdd.county.toUpperCase().indexOf(county) >= 0) { 
          mismatch = false;
        } else if (response.display_name && response.display_name.indexOf(modifiedCity) >= 0) {
          mismatch = false
        } else {
          mismatch = true;
        }
      }

      if (!mismatch) {
        return response;
      }
    }
  }

  return {};
};

module.exports = {
  dateFromUrl: dateFromUrl,
  cleanAddress: cleanAddress,
  geocodeAddress: geocodeAddress,
  findPremiseMatch: findPremiseMatch
}
