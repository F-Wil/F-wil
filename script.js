// Initialize map centered on Hamburg
var map = L.map('map').setView([53.55, 10.00], 11);

// Basemap (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store the GeoJSON layer for filtering
var geoJsonLayer;
var allFeatures = []; // Store all features for filtering

// Load GeoJSON
fetch('data.geojson')
    .then(response => response.json())
    .then(data => {
        geoJsonLayer = L.geoJSON(data, {
            style: function(feature) {
                return {
                    color: getColorByProperty(feature),
                    weight: 2,
                    opacity: 1
                };
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(feature.properties.name);
                }
                allFeatures.push(layer); // Store reference to each layer
            }
        }).addTo(map);
    });

// Function to determine color based on properties
function getColorByProperty(feature) {
    const props = feature.properties;
    if (props.Betriebshof) return '#FF0000';      // Red for depots
    if (props.Wendeschleife) return '#0000FF';    // Blue for turnaround loops
    return '#000000';                              // Gray for others
}

// Toggle filter function - shows/hides features based on property
function toggleFilter(propertyName, shouldShow) {
    allFeatures.forEach(layer => {
        if (layer.feature) {
            const hasProperty = layer.feature.properties[propertyName];
            
            if (shouldShow && hasProperty) {
                // Show features with this property
                if (!map.hasLayer(layer)) {
                    map.addLayer(layer);
                }
            } else if (!shouldShow && hasProperty) {
                // Hide features with this property
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            }
        }
    });
}

// Reset filter - show all features
function resetAllFilters() {
    // Uncheck all checkboxes
    document.getElementById('betriebshof-checkbox').checked = false;
    document.getElementById('wendeschleife-checkbox').checked = false;
    
    // Show all features on map
    allFeatures.forEach(layer => {
        if (layer.feature && !map.hasLayer(layer)) {
            map.addLayer(layer);
        }
    });
}