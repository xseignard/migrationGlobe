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
		var polygon;
		var geometry = new THREE.Geometry();

		// single polygon with potential holes
		if (feature.geometry.type === 'Polygon') {
			polygon = feature.geometry.coordinates;
			this.computePolygon(polygon, geometry, mesh);
		}
		// multi polygon, compute each
		else if (feature.geometry.type === 'MultiPolygon') {
			var polygons = feature.geometry.coordinates;
			for (var i = 0; i < polygons.length; i++) {
				polygon = polygons[i];
				this.computePolygon(polygon, geometry, mesh);
			}
		}
		return geometry;
	};

	GeoUtils.computePolygon = function(polygon, geometry, mesh) {
		for (var i = 0; i < polygon.length; i++) {
			var ring = polygon[i];
			for (var j = 0; j < ring.length; j++) {
				var point = ring[j];
				var position = this.latLonToXyz(point[1], point[0], mesh);
				geometry.vertices.push(position);
				if (j!==0 && j!==ring.length-1) {
					geometry.vertices.push(position);
				}
			}
		}
	};

	// tie this object to the global window one
	window.GeoUtils = GeoUtils;
})();