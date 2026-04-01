// Initialize map centered on Hamburg
var map = L.map('map').setView([53.55, 10.00], 11);

// Basemap (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store the GeoJSON layer for filtering
var geoJsonLayer;

// Load GeoJSON
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        geoJsonLayer = L.geoJSON(data, {
            style: function(feature) {
                return {
                    color: getColorByProperty(feature),
                    weight: 2,
                    opacity: 0.8
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(feature.properties.name);
                }
            }
        }).addTo(map);
    });

// Function to determine color based on properties
function getColorByProperty(feature) {
    const props = feature.properties;
    if (props.Betriebshof) return '#FF0000';      // Red for depots
    if (props.Wendeschleife) return '#0000FF';    // Blue for turnaround loops
    return '#808080';                              // Gray for others
}

// Filter function
function filterByProperty(propertyName, value) {
    map.eachLayer(function(layer) {
        if (layer.feature) {
            const matches = layer.feature.properties[propertyName] === value;
            if (matches) {
                layer.setStyle({ opacity: 0.8 });
                map.addLayer(layer);
            } else {
                layer.setStyle({ opacity: 0.2 });
            }
        }
    });
}

// Reset filter
function resetFilter() {
    map.eachLayer(function(layer) {
        if (layer.feature) {
            layer.setStyle({ 
                opacity: 0.8,
                color: getColorByProperty(layer.feature)
            });
        }
    });
}
