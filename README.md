NYC SLA Violations
=================

A site showing all the businesses that have been charged with a violation from the SLA
due to the new COVID restrictions.

NOTES:
- The updater is pretty janky, and there's some manual address correction that needs to happen after a successful run

To manually run the updater:
- node ./scripts/updater.js

To run the validator:
- node ./scripts/premiseValidator.js

To run the batch premise updater:
- edit the list of entries at the top of scripts/dataCleaner.js
  - premiseID,lat,long;
- node ./scripts/dataCleaner.js

To manually update a premise, do this in the console in node:
- const models = require('/app/models/');
- let premise = {};
- premise = {}; models.Premise.findByPk('1280481').then(prem => { premise = prem;});
- premise.longitude = '-73.9929738';
- premise.latitude = '40.7249134';
- premise.save().then(result => { console.log('done'); });



TODO:
- Better styles?
- Add premises that don't have violations

## About
This Slackbot uses a basic webapp powered by Express to pull updates from the SLA site and display violations using OpenStreetMap. It uses:
- Bull for job scheduling (with Arena to view queued jobs)
- Redis for the datastore for Bull
- Sequelize and SQLite3 DB for violation data
- Nominatim to geocode addresses ([Search API](https://nominatim.org/release-docs/develop/api/Search/))
- SheetJS for the XLSX parsing
- OpenStreetMaps/OpenLayers for the maps display

### Useful Links
- [Eater's July Article on citations](https://ny.eater.com/2020/7/27/21337611/nyc-bars-citations-cuomo-coronavirus-crowds) for the source for the original spreadsheet
- [OpenLayer's popup example](https://openlayers.org/en/latest/examples/popup.html) for how to do popups in open layers
- [Mohit Gupta's guide to markers with OpenLayers](https://medium.com/attentive-ai/working-with-openlayers-4-part-3-setting-customised-markers-and-images-on-map-da3369a81941) for how to setup custom markers
- [Harry Wood's marker popups example](http://harrywood.co.uk/maps/examples/openlayers/marker-popups.view.html) for an outdated view on how to make popups in open layers
- [David Nichols' colorblind calculator](https://davidmathlogic.com/colorblind/#%23B91730-%23E4690C-%23E4C00C-%23004D40) to make sure the red/yellow/orange worked well for different color blindness

## To Remix:
Are you going to remix this? Dope! Follow these steps to get setup.
1) Remix into your own project
2) Follow these notes to get Redis up and running your Glitch app: <https://glitch.com/~redis-notes>
3) Copy .env.sample to your .env and update your properties
4) Update views/components/footer.ejs to include your made by information