import folium
import json

# Initialize map centered on Hamburg
map_center = [53.55, 10.00]
my_map = folium.Map(
    location=map_center,
    zoom_start=11,
    tiles='OpenStreetMap'
)

# Load GeoJSON
with open('data.geojson', 'r') as geojson_file:
    geojson_data = json.load(geojson_file)

# Add GeoJSON to map with popups
folium.GeoJson(
    geojson_data,
    popup=folium.GeoJsonPopup(fields=['name']),
).add_to(my_map)

# Save map to HTML file
my_map.save('map.html')
