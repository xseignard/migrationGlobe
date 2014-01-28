(function() {
	'use strict';
	
	var GeoUtils = {};

	// x,y,z coords to latitude and longitude
	GeoUtils.xyzToLatLon = function(point, mesh) {
		var currentLat = 90 - Math.acos(point.y / mesh.geometry.radius)*180 / Math.PI;
		var currentLon = 90 + Math.atan2(point.x , point.z)*180 / Math.PI % 360;
		return {lat:currentLat, lon:currentLon};
	};
	
	// latitude and longitude to x,y,z coords
	GeoUtils.latLonToXyz = function(lat,lon, mesh) {
		var phi = (90-lat) * Math.PI/180;
		var theta = (180-lon) * Math.PI/180;
		var point = new THREE.Vector3();
		point.x = mesh.geometry.radius * Math.sin(phi) * Math.cos(theta);
		point.y = mesh.geometry.radius * Math.cos(phi);
		point.z = mesh.geometry.radius * Math.sin(phi) * Math.sin(theta);
		point.add(mesh.position);
		return point;
	};

	// calls the OSM api for reverse geocoding
	GeoUtils.getCountryCodeFromOSM = function(lat, lon, callback) {
		var osmRequest = 'http://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=6';
		var request = osmRequest + '&lat=' + lat + '&lon=' + lon;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', request, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				if (data.address && (data.address.country || data.address.country_code)) {
					var country = data.address.country || data.address.country_code;
					callback(country);
				}
				else {
					callback(null);
				}
			}
		};
		xhr.send(null);
	};

	// converts a geojson feature (Polygon or MultiPolygon) to a THREE js geometry on the given sphere
	GeoUtils.geoJsonToGeometry = function(feature, mesh) {
		var geometry = new THREE.Geometry();
		// single polygon with potential holes
		if (feature.geometry.type === 'Polygon') {
			var polygon = feature.geometry.coordinates;
			for (var j = 0; j < polygon.length; j++) {
				var ring = polygon[j];
				for (var k = 0; k < ring.length; k++) {
					var point = ring[k];
					var position = this.latLonToXyz(point[1], point[0], mesh);
					geometry.vertices.push(position);
				}
			}
		}
		// multi polygon
		else {
			var polygons = feature.geometry.coordinates;
			for (var j = 0; j < polygons.length; j++) {
				var polygon = polygons[j];
				for (var k = 0; k < polygon.length; k++) {
					var ring = polygon[k];
					for (var l = 0; l < ring.length; l++) {
						var point = ring[l];
						var position = this.latLonToXyz(point[1], point[0], mesh);
						geometry.vertices.push(position);
					}
				}
			}
		}
		return geometry;
	};

	// tie this object to the global window one
	window.GeoUtils = GeoUtils;
})();