(function() {
	'use strict';
	var Flux = function(mesh) {
		this.mesh = mesh;
	};

	Flux.prototype.quadraticFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng);
		var destPoint = this.coordToPoint(destLat, destLng);
		// distance between the src and dest
		var distance = srcPoint.clone().sub(destPoint).length();
		// get the {x,y,z} position of the middle point of the arc between src and dest and on the sphere 
		var controlPoint = srcPoint.clone().add(destPoint).multiplyScalar(0.5);
		controlPoint.sub(this.mesh.position);
		controlPoint.normalize();
		// set its position up in the air at radius + something
		controlPoint.multiplyScalar(this.mesh.geometry.radius + distance*0.7);
		controlPoint.add(this.mesh.position);
		// create the quadratic flux geometry
		var curve = new THREE.QuadraticBezierCurve3(srcPoint, controlPoint, destPoint);
		var path = new THREE.CurvePath();
		path.add(curve);
		var flux = path.createPointsGeometry(100);
		return flux;
	};

	Flux.prototype.cubicFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng);
		var destPoint = this.coordToPoint(destLat, destLng);
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
		var curve = new THREE.CubicBezierCurve3(srcPoint, srcControl, destControl, destPoint);
		var path = new THREE.CurvePath();
		path.add(curve);
		var flux = path.createPointsGeometry(100);
		return flux;
	};

	Flux.prototype.doubleCubicFlux = function(srcLat, srcLng, destLat, destLng) {
		// convert {latitude,longitude} coordinates to {x,y,z} ones
		var srcPoint = this.coordToPoint(srcLat, srcLng);
		var destPoint = this.coordToPoint(destLat, destLng);
		// distance between the src and dest
		var distance = srcPoint.clone().sub(destPoint).length();
		//	midpoint of the flux
		var midPoint = srcPoint.clone().add(destPoint).multiplyScalar(0.5);
		midPoint.sub(this.mesh.position);
		midPoint.normalize();
		// set its position up in the air at radius + something
		midPoint.multiplyScalar(this.mesh.geometry.radius + distance * 0.2); 
		midPoint.add(this.mesh.position);
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
		var flux = new THREE.Geometry();
		flux.vertices = points;
		return flux;
	};

	Flux.prototype.coordToPoint = function(lat, lng) {
		var phi = (90-lat) * Math.PI/180;
		var theta = (180-lng) * Math.PI/180;
		var point = new THREE.Vector3();
		point.x = this.mesh.geometry.radius * Math.sin(phi) * Math.cos(theta);
		point.y = this.mesh.geometry.radius * Math.cos(phi);
		point.z = this.mesh.geometry.radius * Math.sin(phi) * Math.sin(theta);
		point.add(this.mesh.position);
		return point;
	};

	window.Flux = Flux;

})();