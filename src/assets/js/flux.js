(function() {
	'use strict';
	var Flux = function(mesh) {
		this.mesh = mesh;
	};

	Flux.prototype.quadraticFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng, this.mesh.geometry.radius);
		var destPoint = this.coordToPoint(destLat, destLng, this.mesh.geometry.radius);
		// distance between the src and dest
		var distance = srcPoint.clone().sub(destPoint).length();
		// get the {latitude,longitude} of the middle point then convert it to {x,y,z}
		var midCoord = this.midCoord(srcLat, srcLng, destLat, destLng);
		var midPoint = this.coordToPoint(midCoord.latitude, midCoord.longitude, this.mesh.geometry.radius);
		midPoint.normalize();
		// set its position up in the air at radius + something
		midPoint.multiplyScalar(this.mesh.geometry.radius + distance * 0.5); 
		// create the quadratic flux
		var material = new THREE.LineBasicMaterial({color: 'white', linewidth: 1});
		var curve = new THREE.QuadraticBezierCurve3(srcPoint, midPoint, destPoint);
		var path = new THREE.CurvePath();
		path.add(curve);
		var geometry = path.createPointsGeometry(100);
		var flux = new THREE.Line(geometry, material);
		return flux;
	};

	Flux.prototype.cubicFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng, this.mesh.geometry.radius);
		var destPoint = this.coordToPoint(destLat, destLng, this.mesh.geometry.radius);
		// distance between the src and dest
		var distance = srcPoint.clone().sub(destPoint).length();
		// src control point
		var srcControl = srcPoint.clone().sub(this.mesh.position);
		srcControl.normalize();
		srcControl.multiplyScalar(distance);
		srcControl.add(srcPoint);
		// dest control point
		var destControl = destPoint.clone().sub(this.mesh.position);
		destControl.normalize();
		destControl.multiplyScalar(distance);
		destControl.add(destPoint);
		// create the cubic flux
		var material = new THREE.LineBasicMaterial({color: 'red', linewidth: 1});
		var curve = new THREE.CubicBezierCurve3(srcPoint, srcControl, destControl, destPoint);
		var path = new THREE.CurvePath();
		path.add(curve);
		var geometry = path.createPointsGeometry(100);
		var flux = new THREE.Line(geometry, material);
		return flux;
	};

	Flux.prototype.doubleCubicFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng, this.mesh.geometry.radius);
		var destPoint = this.coordToPoint(destLat, destLng, this.mesh.geometry.radius);
		// distance between the src and dest
		var distance = srcPoint.clone().sub(destPoint).length();
		//	midpoint of the flux
		var midCoord = this.midCoord(srcLat, srcLng, destLat, destLng);
		var midPoint = this.coordToPoint(midCoord.latitude, midCoord.longitude, this.mesh.geometry.radius);
		midPoint.normalize();
		// set its position up in the air at radius + something
		midPoint.multiplyScalar(this.mesh.geometry.radius + distance * 0.2); 
		// calculate the normal from the src and dest points
		var normal = srcPoint.clone().sub(destPoint);
		normal.normalize();
		// calculate control points
		var srcControl = midPoint.clone().add(normal.clone().multiplyScalar(distance/2));					
		var destControl = midPoint.clone().add(normal.clone().multiplyScalar(-distance/2));
		// create 2 cubic bezier:
		// - one from src point to mid point
		// - one from mid point to dest point
		// the bezier will pass through the mid point 
		// and since you can place it, it's easier to draw a nice route
		// first (resp. last) control point is the same as the src (resp. dest), it gives better results than a quadratic bezier
		var srcBezier = new THREE.CubicBezierCurve3(srcPoint, srcPoint, srcControl, midPoint);											
		var destBezier = new THREE.CubicBezierCurve3(midPoint, destControl, destPoint, destPoint);
		// get the points from the 2 bezier curves that will enable the creation of the flux
		var points = srcBezier.getPoints(50);
		// remove the last sampled point since it's the starting point of the dest bezier
		points = points.splice(0,points.length-1);
		points = points.concat(destBezier.getPoints(50));
		// create the flux
		var geometry = new THREE.Geometry();
		geometry.vertices = points;
		var material = new THREE.LineBasicMaterial({color: 'blue', linewidth: 1});
		var flux = new THREE.Line(geometry, material);
		return flux;
	};

	Flux.prototype.coordToPoint = function(lat, lng, radius) {
		var phi = (90-lat) * Math.PI/180;
		var theta = (180-lng) * Math.PI/180;
		var point = new THREE.Vector3();
		point.x = radius * Math.sin(phi) * Math.cos(theta);
		point.y = radius * Math.cos(phi);
		point.z = radius * Math.sin(phi) * Math.sin(theta);
		return point;
	};

	Flux.prototype.midCoord = function(srcLat, srcLng, destLat, destLng) {
		var phi1 = srcLat * Math.PI / 180, 
			theta1 = srcLng * Math.PI / 180,
			phi2 = destLat * Math.PI / 180,
			deltaLng = (destLng - srcLng) * Math.PI / 180;
		var bearingX = Math.cos(phi2) * Math.cos(deltaLng);
		var bearingY = Math.cos(phi2) * Math.sin(deltaLng);
		var phi3 = Math.atan2(
				Math.sin(phi1) + Math.sin(phi2),
				Math.sqrt((Math.cos(phi1) + bearingX) * (Math.cos(phi1) + bearingX) + bearingY*bearingY)
		);
		var theta3 = theta1 + Math.atan2(bearingY, Math.cos(phi1) + bearingX);
		// normalise to -180..+180º
		theta3 = (theta3 + 3*Math.PI) % (2*Math.PI) - Math.PI;
		return {latitude: phi3 * 180/ Math.PI, longitude: theta3 * 180/ Math.PI};
	};

	window.Flux = Flux;

})();