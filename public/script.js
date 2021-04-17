const dotUrl = 'https://cdn.glitch.com/903fd513-4639-462e-afb1-792b17d99577%2Fdot.png?v=1599693233486';

//** Add content for popup and set up
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const getPopupHtml = (feature) => {
  let premise = feature.get('description');
  let html = '';
  html += `${premise.name}<br>`;
  html += `${premise.address}, ${premise.city}<br>`;
  html += `License ID: ${premise.licenseId}&nbsp;&nbsp;&nbsp;&nbsp;Type:${premise.licenseType}<br>`;
  if (premise.suspension && premise.suspension.dateImposed) {
    if (premise.suspension.suspended) {
      html += 'S';
    } else {
      html += 'Originally s';
    }
    html += `uspended on ${premise.suspension.dateImposed}, ${premise.suspension.status}<br>`;
  } else {
    html += 'Never suspended<br>';
  }
  html += '<br><u>Violations:</u><span class="small-text">';
  premise.violations.forEach((viol) => {
    let charge = viol.chargeDate.split('.')[0];
    html += `<br>${charge} - ${viol.description}`;
  });
  html += '</span>';
  return html;
};

let overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};
// END

let map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  overlays: [overlay],
  view: new ol.View({
    center: ol.proj.fromLonLat([-75.54467840743847, 42.737176000272626]), // NY State center
    zoom: 7
  })
});

//** Add data from premises to map
let featuresArray = [];
for (let i=0; i < premiseData.length; i++) {
  let premise = premiseData[i];
  if (!premise) { continue; }

  let feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([premise.lon, premise.lat])),
    description: premise
  });
  let color = '#e4c00c';
  if (premise.suspension && premise.suspension.suspended) {
    color = '#B91730';
  } else {
    if (premise.violations.length > 1) {
      color = '#e4690c';
    }
  }
  feature.setStyle(new ol.style.Style({
    image: new ol.style.Icon(({
      color: color,
      crossOrigin: 'anonymous',
      src: dotUrl
    }))
  }));
  featuresArray.push(feature);
}

let vectorSource = new ol.source.Vector({
  features: featuresArray
});
let vectorLayer = new ol.layer.Vector({
  source: vectorSource,
});
map.addLayer(vectorLayer);
// END


//** Add interaction for popups
let select = new ol.interaction.Select({ layers: [vectorLayer] });
map.addInteraction(select);

select.on('select', (e) => {
  let coordinate = e.mapBrowserEvent.coordinate;

  if (e.selected[0]) {
    content.innerHTML = getPopupHtml(e.selected[0]);
    overlay.setPosition(coordinate);
  } else if (e.selected.length === 0) {
    overlay.setPosition(undefined);
  }
});
// END
