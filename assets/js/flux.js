(function(THREE) {
	'use strict';
	// scene stuff
	var width, height, scene, camera, renderer, planet;
	// interaction stuff
	var curZoomSpeed = 0,
		mouse = {x:0, y:0},
		mouseOnDown = {x:0, y:0},
		rotation = {x:0, y:0},
		target = {x:Math.PI*3/2, y:Math.PI/6.0},
		targetOnDown = {x:0, y:0},
		distance = 100000,
		distanceTarget = 100000,
		PI_HALF = Math.PI/2,
		overRenderer;

	var Globe = function(container, opts) {
		opts = opts || {};

		width = window.innerWidth;
		height = window.innerHeight;

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(30, width/height, 1, 10000);
		camera.position.z = distance;

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(width, height);
		renderer.domElement.style.position = 'absolute';
		container.appendChild(renderer.domElement);
		
		var geometry = new THREE.SphereGeometry(200, 40, 30);

		var texture = opts.texture || 'assets/img/world.jpg';
		var material = new THREE.MeshBasicMaterial();
		material.map = THREE.ImageUtils.loadTexture(texture);

		planet = new THREE.Mesh(geometry, material);
		planet.rotation.y = Math.PI;
		scene.add(planet);

		container.addEventListener('mousedown', onMouseDown, false);
		container.addEventListener('mousewheel', onMouseWheel, false);
		document.addEventListener('keydown', onDocumentKeyDown, false);
		window.addEventListener('resize', onWindowResize, false);
		container.addEventListener('mouseover', function() {
			overRenderer = true;
		}, false);
		container.addEventListener('mouseout', function() {
			overRenderer = false;
		}, false);
	};

	Globe.prototype.animate = function() {
		var self = this;
		requestAnimationFrame(function() {
			self.animate.call(self);
		});
		render();
	};

	Globe.prototype.addFlux = function(srcLat, srcLng, destLat, destLng) {
		var srcPoint = this.coordToPoint(srcLat, srcLng);
		var destPoint = this.coordToPoint(destLat, destLng);

		var deltaX = destPoint.x - srcPoint.x;
		var deltaY = destPoint.y - srcPoint.y;
		var deltaZ = destPoint.z - srcPoint.z;
		var distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);

		var midCoord = this.midCoord(srcLat, srcLng, destLat, destLng);
		var midPoint = this.coordToPoint(midCoord.latitude, midCoord.longitude, distance*2);
		
		var material = new THREE.LineBasicMaterial({color: 'green', linewidth: 5});
		var curve = new THREE.QuadraticBezierCurve3(srcPoint, midPoint, destPoint);
		var path = new THREE.CurvePath();
        path.add(curve);
		var geometry = path.createPointsGeometry(100);
        var flux = new THREE.Line(geometry, material);
		scene.add(flux);

		/*
		var cubic1 = new THREE.Vector3();
		cubic1.x = midPoint.x - 0.3*srcPoint.x;
		cubic1.y = midPoint.y - 0.3*srcPoint.y;
		cubic1.z = midPoint.z - 0.3*srcPoint.z;
		var cubic2 = new THREE.Vector3();
		cubic2.x = destPoint.x - 0.3*midPoint.x;
		cubic2.y = destPoint.y - 0.3*midPoint.y;
		cubic2.z = destPoint.z - 0.3*midPoint.z;
		material = new THREE.LineBasicMaterial({color: 'red', linewidth: 6});
		curve = new THREE.CubicBezierCurve3(srcPoint, cubic1, cubic2, destPoint);
		path = new THREE.CurvePath();
        path.add(curve);
		geometry = path.createPointsGeometry(100);
        flux = new THREE.Line(geometry, material);
		scene.add(flux);
		*/
    };

	Globe.prototype.createCube = function(lat, lng, elevation) {
		var geometry = new THREE.CubeGeometry(1,1,1);
		var material = new THREE.MeshBasicMaterial({color: 'red'});
		var cube = new THREE.Mesh(geometry, material);
		cube.position = this.coordToPoint(lat, lng, elevation);
		scene.add(cube);
		return cube;
	};

	Globe.prototype.coordToPoint = function(lat, lng, elevation) {
		var phi = (90 - lat) * Math.PI / 180;
		var theta = (180 - lng) * Math.PI / 180;
		var offset = planet.geometry.radius;
		elevation = elevation || 0;
		var point = new THREE.Vector3();
		point.x = (offset + elevation) * Math.sin(phi) * Math.cos(theta);
		point.y = (offset + elevation) * Math.cos(phi);
		point.z = (offset + elevation) * Math.sin(phi) * Math.sin(theta);
		return point;
	};

	Globe.prototype.midCoord = function(srcLat, srcLng, destLat, destLng) {
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

	var onMouseDown = function(event) {
		event.preventDefault();

		container.addEventListener('mousemove', onMouseMove, false);
		container.addEventListener('mouseup', onMouseUp, false);
		container.addEventListener('mouseout', onMouseOut, false);

		mouseOnDown.x = - event.clientX;
		mouseOnDown.y = event.clientY;

		targetOnDown.x = target.x;
		targetOnDown.y = target.y;

		container.style.cursor = 'move';
	};

	var onMouseMove = function(event) {
		mouse.x = - event.clientX;
		mouse.y = event.clientY;

		var zoomDamp = distance/1000;

		target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
		target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

		target.y = target.y > PI_HALF ? PI_HALF : target.y;
		target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
	};

	var onMouseUp, onMouseOut;
	onMouseUp = onMouseOut = function(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
		container.style.cursor = 'auto';
	};

	var onMouseWheel = function(event) {
		event.preventDefault();
		if (overRenderer) {
			zoom(event.wheelDeltaY * 0.3);
		}
		return false;
	};

	var onDocumentKeyDown = function(event) {
		switch (event.keyCode) {
			case 38:
				zoom(100);
				event.preventDefault();
				break;
			case 40:
				zoom(-100);
				event.preventDefault();
				break;
		}
	};

	var onWindowResize = function(event) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	};

	var zoom = function(delta) {
		distanceTarget -= delta;
		distanceTarget = Math.min(distanceTarget, 2000);
		distanceTarget = Math.max(distanceTarget, 500);
	};

	var render = function() {
		zoom(curZoomSpeed);

		rotation.x += (target.x - rotation.x) * 0.1;
		rotation.y += (target.y - rotation.y) * 0.1;
		distance += (distanceTarget - distance) * 0.3;

		camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
		camera.position.y = distance * Math.sin(rotation.y);
		camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

		camera.lookAt(planet.position);

		renderer.render(scene, camera);
	};

	window.Globe = Globe;

})(THREE);