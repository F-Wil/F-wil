// Karte initialisieren
const map = L.map('map', {
    zoomControl: false,
    attributionControl: true
}).setView([53.55, 9.99], 11);


// ---------------------
// BASEMAP LAYER
// ---------------------

// Minimal OSM
const osmMinimal = L.tileLayer(
'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
{
    attribution: '&copy; OSM &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
    className: 'minimal-karte'
}
);

// ÖPNV Karte
const opnvKarte = L.tileLayer(
'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
{
    maxZoom: 18,
    attribution: 'Map memomaps.de, data © OpenStreetMap',
    className: 'opnv-karte'
}
);

// Satellit (ESRI)
const esriSat = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{
    attribution: 'Tiles © Esri',
    opacity: 0.5,
    className: 'satellite'
}
);

// ESRI Gray
const esriGray = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
{
    attribution: 'Tiles © Esri',
    className: 'esri-world-gray'
}
);

// Verkehrskarte
const Verkehrskarte = L.tileLayer(
'https://tileserver.memomaps.de/tilegen/{z}/{x}/{y}.png',
{
    maxZoom: 18,
    attribution: 'Map memomaps.de, data © OpenStreetMap',
    className: 'opnv-karte'
}
);

// Dark Matter (OpenMapTiles)
const darkMatter = L.tileLayer(
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
{
    attribution: '&copy; OSM &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
    className: 'dark-matter'
}
);

// ---------------------
// STANDARDLAYER
// ---------------------

// Beim Laden nur Minimal OSM anzeigen
osmMinimal.addTo(map);


// ---------------------
// LAYER SWITCHER
// ---------------------

const overlays = {
    "Straßenbahn (historisch)": L.layerGroup(),
    "U-Bahn (aktuell)": L.layerGroup(),
    "S-Bahn (aktuell)": L.layerGroup()
};

const baseLayers = {
    "Helle Karte": osmMinimal,
    "Dunkle Karte": darkMatter,
    "ESRI Satellit": esriSat,
    "ESRI Gray": esriGray,
    "ÖPNV Karte": opnvKarte
};


const layersControl = L.control.layers(baseLayers, overlays, {collapsed:false}).addTo(map);

// Reorder Leaflet control so overlays appear above base layers
const layersControlContainer = layersControl.getContainer();
if (layersControlContainer) {
    const overlaysSection = layersControlContainer.querySelector('.leaflet-control-layers-overlays');
    const baseLayersSection = layersControlContainer.querySelector('.leaflet-control-layers-base');
    if (overlaysSection && baseLayersSection) {
        const parent = baseLayersSection.parentNode;
        if (parent && parent.contains(overlaysSection) && parent.contains(baseLayersSection) && parent.firstChild !== overlaysSection) {
            parent.insertBefore(overlaysSection, baseLayersSection);
        }
    }
}

// Set Minimal as active by default
osmMinimal.addTo(map);

// Add only Straßenbahn overlay by default
overlays["Straßenbahn (historisch)"].addTo(map);


// ---------------------
// OPACITY SLIDER (optional)
// ---------------------

function setLayerOpacity(layer, value) {
    layer.setOpacity(value);
}


// ---------------------
// GEOCODER (Adresssuche)
// ---------------------

const geocoder = L.Control.geocoder({
    defaultMarkGeocode: true
}).addTo(map);


// ---------------------
// Straßenbahn Layer
// ---------------------

let tramLayer = null;
let ubahnLayer = null;
let sbahnLayer = null;


// ---------------------
// GeoJSON Daten
// ---------------------

let geoData = null;
let ubahnData = null;
let sbahnData = null;
let sbahnS5stadeData = null;
let tramData = null;
let landesgrenzeData = null;
let landesgrenzeLayer = null;


// Beispiel GeoJSON laden
// fetch('data/tramlines.geojson')
//   .then(res => res.json())
//   .then(data => {
//       geoData = data;
//       updateMap(parseInt(slider.value));
//   });

// Load U-Bahn data
fetch('data/ubahn.geojson')
  .then(res => res.json())
  .then(data => {
      ubahnData = data;
      updateMap(parseInt(slider.value));
  });

// Load S-Bahn data
fetch('data/sbahn.geojson')
  .then(res => res.json())
  .then(data => {
      sbahnData = data;
      updateMap(parseInt(slider.value));
  });

// Load S-Bahn S5 Stade data
fetch('data/sbahnS5stade.geojson')
  .then(res => res.json())
  .then(data => {
      sbahnS5stadeData = data;
      updateMap(parseInt(slider.value));
  });

// Load Straßenbahn data
fetch('data/Strassenbahn.geojson')
  .then(res => res.json())
  .then(data => {
      tramData = data;
      updateMap(parseInt(slider.value));
  });

// Load Landesgrenze data
fetch('data/Landesgrenze_HH.geojson')
  .then(res => res.json())
  .then(data => {
      landesgrenzeData = data;
      renderLandesgrenze();
  })
  .catch(err => console.log('Landesgrenze data could not be loaded:', err));


// ---------------------
// Kartenupdate nach Jahr
// ---------------------

function updateMap(year) {

    // Update Tram layer
    if (tramLayer) {
        map.removeLayer(tramLayer);
    }
    if (geoData) {
        tramLayer = L.geoJSON(geoData, {

            filter: function(feature) {

                const opened = feature.properties.year_opened;
                const closed = feature.properties.year_closed || 9999;

                return opened <= year && closed >= year;

            },

            style: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--tram-color').trim() || "#d40000",
                weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 3,
                opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-opacity')) || 1.0,
                dashArray: getComputedStyle(document.documentElement).getPropertyValue('--line-dasharray').trim(),
                lineJoin: 'round',
                lineCap: 'round'
            },
            className: 'transit-line',
            onEachFeature: function(feature, layer) {
                var outlineWeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-outline-weight')) || 0;
                if (outlineWeight > 0) {
                    var outlineColor = getComputedStyle(document.documentElement).getPropertyValue('--line-outline-color').trim() || '#ffffff';
                    var originalStyle = layer.options.style;
                    layer.setStyle({
                        color: originalStyle.color,
                        weight: outlineWeight + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 3)
                    });
                }
            }

        }).addTo(map);
    }

    // Update U-Bahn layer
    overlays["U-Bahn (aktuell)"].clearLayers();
    if (ubahnData) {
        ubahnLayer = L.geoJSON(ubahnData, {
            filter: function(feature) {
                return feature.geometry &&
                    (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString");
            },
            style: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--ubahn-color').trim() || "#26547c",
                weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 4,
                opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-opacity')) || 1.0,
                dashArray: getComputedStyle(document.documentElement).getPropertyValue('--line-dasharray').trim(),
                lineJoin: 'round',
                lineCap: 'round'
            },
            className: 'transit-line',
            onEachFeature: function(feature, layer) {
                layer.bindTooltip("U-Bahn");
                var outlineWeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-outline-weight')) || 0;
                if (outlineWeight > 0) {
                    var outlineColor = getComputedStyle(document.documentElement).getPropertyValue('--line-outline-color').trim() || '#ffffff';
                    var originalStyle = layer.options.style;
                    layer.setStyle({
                        color: originalStyle.color,
                        weight: outlineWeight + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 4)
                    });
                }
            }
        });
        overlays["U-Bahn (aktuell)"].addLayer(ubahnLayer);
    }

    // Update S-Bahn layer
    overlays["S-Bahn (aktuell)"].clearLayers();
    if (sbahnData || sbahnS5stadeData) {
        // Combine both S-Bahn datasets
        let combinedSbahnData = {
            type: "FeatureCollection",
            features: []
        };
        if (sbahnData && sbahnData.features) {
            combinedSbahnData.features = combinedSbahnData.features.concat(sbahnData.features);
        }
        if (sbahnS5stadeData && sbahnS5stadeData.features) {
            combinedSbahnData.features = combinedSbahnData.features.concat(sbahnS5stadeData.features);
        }
        
        sbahnLayer = L.geoJSON(combinedSbahnData, {
            filter: function(feature) {
                return feature.geometry &&
                    (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString");
            },
            style: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--sbahn-color').trim() || "#cce3de",
                weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 4,
                opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-opacity')) || 1.0,
                dashArray: getComputedStyle(document.documentElement).getPropertyValue('--line-dasharray').trim(),
                lineJoin: 'round',
                lineCap: 'round'
            },
            className: 'transit-line',
            onEachFeature: function(feature, layer) {
                layer.bindTooltip("S-Bahn");
                var outlineWeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-outline-weight')) || 0;
                if (outlineWeight > 0) {
                    var outlineColor = getComputedStyle(document.documentElement).getPropertyValue('--line-outline-color').trim() || '#ffffff';
                    var originalStyle = layer.options.style;
                    layer.setStyle({
                        color: originalStyle.color,
                        weight: outlineWeight + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 4)
                    });
                }
            }
        });
        overlays["S-Bahn (aktuell)"].addLayer(sbahnLayer);
    }

    // Update Straßenbahn layer
    overlays["Straßenbahn (historisch)"].clearLayers();
    if (tramData) {
        tramLayer = L.geoJSON(tramData, {
            filter: function(feature) {
                if (!feature.geometry) return false;

                var geomType = feature.geometry.type;
                if (geomType === "LineString" || geomType === "MultiLineString") {
                    // Line features
                    var bauPf = feature.properties.Bau_Pf;
                    var stillPf = feature.properties.Stilllegung_Pf;
                    var bauE = feature.properties.Bau_E;
                    var stillE = feature.properties.Stilllegung_E;

                    // Helper function to parse year values
                    function parseYear(val) {
                        if (val === null || val === undefined || val === 'null' || val === 'NULL' || val === '') {
                            return null;
                        }
                        return Number(val);
                    }

                    bauPf = parseYear(bauPf);
                    stillPf = parseYear(stillPf);
                    bauE = parseYear(bauE);
                    stillE = parseYear(stillE);

                    // Determine if visible
                    var visible = false;
                    if (bauPf !== null && year >= bauPf && (stillPf === null || year < stillPf)) {
                        visible = true; // Pferdebahn period
                    }
                    if (bauE !== null && year >= bauE && (stillE === null || year < stillE)) {
                        visible = true; // Electrified period
                    }
                    return visible;
                } else if (geomType === "Point") {
                    // Point features (Wendeschleife, Betriebshof) - show if no temporal properties or within time range
                    var bau = feature.properties.Bau || feature.properties.bau || feature.properties.BAU;
                    var still = feature.properties.Stilllegung || feature.properties.stilllegung || feature.properties.STILLLEGUNG;

                    function parseYear(val) {
                        if (val === null || val === undefined || val === 'null' || val === 'NULL' || val === '') {
                            return null;
                        }
                        return Number(val);
                    }

                    bau = parseYear(bau);
                    still = parseYear(still);

                    // If no temporal properties, always show; otherwise check time range
                    var visible = true;
                    if (bau !== null || still !== null) {
                        visible = (bau === null || year >= bau) && (still === null || year < still);
                    }
                    return visible;
                }
                return false;
            },
            style: function(feature) {
                var year = parseInt(slider.value);
                var geomType = feature.geometry.type;

                if (geomType === "LineString" || geomType === "MultiLineString") {
                    var bauPf = feature.properties.Bau_Pf;
                    var bauE = feature.properties.Bau_E;

                    function parseYear(val) {
                        if (val === null || val === undefined || val === 'null' || val === 'NULL' || val === '') {
                            return null;
                        }
                        return Number(val);
                    }

                    bauPf = parseYear(bauPf);
                    bauE = parseYear(bauE);

                    var isPferdebahn = (bauPf !== null && year >= bauPf && (bauE === null || year < bauE));
                    var dashArray = isPferdebahn ? getComputedStyle(document.documentElement).getPropertyValue('--line-dasharray-pferdebahn').trim() : getComputedStyle(document.documentElement).getPropertyValue('--line-dasharray').trim();

                    return {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--tram-color').trim() || "#ef476f",
                        weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-weight')) || 4,
                        opacity: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--line-opacity')) || 1.0,
                        dashArray: dashArray,
                        lineJoin: 'round',
                        lineCap: 'round'
                    };
                }
            },
            pointToLayer: function(feature, latlng) {
                var type = feature.properties.Type || feature.properties.type || feature.properties.TYPE;
                if (type === "Wendeschleife" || type === "wendeschleife") {
                    var marker = L.circleMarker(latlng, {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--wendeschleife-color').trim() || "#f36078",
                        weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wendeschleife-weight').trim()) || 1,
                        fillColor: getComputedStyle(document.documentElement).getPropertyValue('--wendeschleife-color').trim() || "#f36078",
                        fillOpacity: 0.8,
                        radius: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wendeschleife-radius').trim()) || 8
                    });
                    marker.bindTooltip("Wendeschleife");
                    return marker;
                } else if (type === "Betriebshof" || type === "betriebshof") {
                    var marker = L.circleMarker(latlng, {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--betriebshof-color').trim() || "#646EFA",
                        weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--betriebshof-weight').trim()) || 4,
                        fillColor: getComputedStyle(document.documentElement).getPropertyValue('--betriebshof-color').trim() || "#646EFA",
                        fillOpacity: 0.8,
                        radius: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--betriebshof-radius').trim()) || 10
                    });
                    marker.bindTooltip("Betriebshof");
                    return marker;
                }
                return L.marker(latlng);
            },
            onEachFeature: function(feature, layer) {
                var geomType = feature.geometry.type;
                if (geomType === "LineString" || geomType === "MultiLineString") {
                    var bauPf = feature.properties.Bau_Pf;
                    var stillPf = feature.properties.Stilllegung_Pf;
                    var bauE = feature.properties.Bau_E;
                    var stillE = feature.properties.Stilllegung_E;

                    function parseYear(val) {
                        if (val === null || val === undefined || val === 'null' || val === 'NULL' || val === '') {
                            return null;
                        }
                        return Number(val);
                    }

                    bauPf = parseYear(bauPf);
                    stillPf = parseYear(stillPf);
                    bauE = parseYear(bauE);
                    stillE = parseYear(stillE);

                    var tooltipText = "";
                    if (bauPf !== null) {
                        tooltipText += "Pferdebahn";
                        if (bauPf) tooltipText += " von " + bauPf;
                        if (stillPf) tooltipText += " – " + stillPf;
                    }
                    if (bauE !== null) {
                        if (tooltipText) tooltipText += "<br>";
                        tooltipText += "Straßenbahn, elektrisch";
                        if (bauE) tooltipText += " von " + bauE;
                        if (stillE) tooltipText += " – " + stillE;
                    }

                    layer.bindTooltip(tooltipText);
                }
            },
            className: 'transit-line'
        });
        overlays["Straßenbahn (historisch)"].addLayer(tramLayer);
    }

    if (landesgrenzeData) {
        renderLandesgrenze();
    }

}

// ---------------------
// LANDESGRENZE RENDERING
// ---------------------

function renderLandesgrenze() {
    if (landesgrenzeLayer) {
        map.removeLayer(landesgrenzeLayer);
    }
    
    if (landesgrenzeData) {
        landesgrenzeLayer = L.geoJSON(landesgrenzeData, {
            className: 'landesgrenze',
            style: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--landesgrenze-color').trim() || '#333333',
                weight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--landesgrenze-weight')) || 2,
                opacity: 0.8,
                dashArray: getComputedStyle(document.documentElement).getPropertyValue('--landesgrenze-dasharray').trim() || '5,3',
                fill: false
            }
        }).addTo(map);
        landesgrenzeLayer.bringToBack();
    }
}

// ---------------------
// TIMELINE
// ---------------------

const slider = document.getElementById("timeline");
const yearDisplay = document.getElementById("year-display");

// Initial year display
yearDisplay.textContent = parseInt(slider.value);
positionYearDisplay();

// Update year on slider input
function updateYear() {
    const year = parseInt(slider.value);
    yearDisplay.textContent = year;
    positionYearDisplay();
    updateMap(year);
}

// compute and apply horizontal position of the year label
function positionYearDisplay() {
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const val = parseInt(slider.value);
    const pct = (val - min) / (max - min);
    const containerRect = document.getElementById('timeline-container').getBoundingClientRect();
    const sliderRect = slider.getBoundingClientRect();
    const thumbWidth = 30; // matches CSS thumb width
    const relativeLeft = sliderRect.left - containerRect.left;
    const x = relativeLeft + pct * (sliderRect.width - thumbWidth) + thumbWidth / 2;
    yearDisplay.style.left = x + 'px';
}

slider.addEventListener("input", updateYear);
slider.addEventListener("change", updateYear);

// Year arrow buttons
const prevYearBtn = document.getElementById("prev-year");
const nextYearBtn = document.getElementById("next-year");

prevYearBtn.addEventListener("click", function() {
    const currentValue = parseInt(slider.value);
    if (currentValue > parseInt(slider.min)) {
        slider.value = currentValue - 1;
        updateYear();
    }
});

nextYearBtn.addEventListener("click", function() {
    const currentValue = parseInt(slider.value);
    if (currentValue < parseInt(slider.max)) {
        slider.value = currentValue + 1;
        updateYear();
    }
});

// Legend toggle
const legendToggle = document.getElementById("legend-toggle");
const legendContent = document.getElementById("legend-content");

legendToggle.addEventListener("click", function() {
    if (legendContent.style.display === "block") {
        legendContent.style.display = "none";
    } else {
        legendContent.style.display = "block";
    }
});
