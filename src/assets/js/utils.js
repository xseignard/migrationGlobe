(function() {
	'use strict';

	var GeoUtils = {};

	/**
	 * Converts x,y,z coords to latitude and longitude, for the given mesh
	 * @param {THREE.Vector3} point - the point to convert
	 * @param {THREE.Mesh} mesh - the sphere geometry based mesh
	 * @returns {Obejct} containing lat and lon coords
	 */
	GeoUtils.xyzToLatLon = function(point, mesh) {
		var currentLat = 90 - Math.acos(point.y/mesh.geometry.radius) * 180/Math.PI;
		var currentLon = (270 + Math.atan2(point.x, point.z) * 180/Math.PI) % 360;
		if (currentLon >= 180) currentLon -= 360;
		return {lat:currentLat, lon:currentLon};
	};

	/**
	 * Converts latitude and longitude to x,y,z coords, for the given mesh
	 * @param {Number} lat - latitude
	 * @param {Number} lon - longitude
	 * @param {THREE.Mesh} mesh - the sphere geometry based mesh
	 * @returns {Obejct} containing x,y and z coords
	 */
	GeoUtils.latLonToXyz = function(lat,lon, mesh) {
		var phi = lat * Math.PI/180;
		var theta = lon * Math.PI/180;
		var point = new THREE.Vector3();
		point.x = mesh.geometry.radius * Math.cos(phi) * Math.cos(theta);
		point.y = mesh.geometry.radius * Math.sin(phi);
		point.z = -mesh.geometry.radius * Math.cos(phi) * Math.sin(theta);
		point.add(mesh.position);
		return point;
	};

	/**
	 * Loads the indexed map and translates the xyz coordinates where the user clicked on the globe
	 * to xy coordinates on its greyscale indexed map.
	 * @param {THREE.Vector3} point - the clicked point on the mesh
	 * @param {Globe} globe - the globe, holding the indexed map
	 * @param {function} callback - will pass the result (number from 0 to 255)
	 */
	GeoUtils.getIndex = function(point, globe, callback) {
		var img = new Image();
		img.src = 'assets/img/indexed_map.png';
		img.onload = function() {
			// get the xy coords from the point
			var latLon = GeoUtils.xyzToLatLon(point, globe);
			var x = Math.floor((latLon.lon/360)* img.width + img.width/2);
			var y = Math.floor((-latLon.lat/360)* img.width + img.height/2);
			if (x>img.width) x-=img.width;
			if (y>img.height) y-=img.height;
			// create a canvas to manipulate the image
			var canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
			// get the pixel data and callback
			var pixelData = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
			callback(pixelData[0]);
		}
	};

	/**
	 * Loads the indexed countries definition and translate the given index
	 * to the corresponding country
	 * @param {Number} index - the country index
	 * @param {function} callback - will pass the result
	 */
	GeoUtils.getCountryCodeFromIndex = function(index, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/indexed_countries.json', true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				callback(data[index-1]);
			}
		};
		index > 0 ? xhr.send(null) : callback(null);
	};

	// tie this object to the global window one
	window.GeoUtils = GeoUtils;
})();
