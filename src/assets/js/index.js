(function() {
	'use strict';
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var container, stats, camera, controls, scene, renderer, earth;

	var uniforms;

	var GuiControls = function() {
		this.speed = 0.004;
		this.color = '#00d3e1';
	};

	var guiControls = new GuiControls();

	init();
	animate();
	drawBorders();

	function init() {
		// setup of camera, controls, stats, renderer and scene
		container = document.getElementById('container');
		var width = window.innerWidth;
		var height = window.innerHeight;

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x111111, 1800, 2000);

		camera = new THREE.PerspectiveCamera(45, width/height, 1, 2000);
		camera.position.z = 1500;
		camera.lookAt(scene.position);

		controls = new THREE.OrbitControls(camera);
		controls.minDistance = 500;
		controls.maxDistance = 2000;
		controls.addEventListener('change', render);

		stats = new Stats();
		document.body.appendChild(stats.domElement);

		// dat.gui
		var gui = new dat.GUI();
		gui.add(guiControls, 'speed', 0.001, 0.03);
		gui.addColor(guiControls, 'color');

		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setSize(width, height);
		renderer.domElement.style.position = 'absolute';
		container.appendChild(renderer.domElement);

		window.addEventListener('resize', onWindowResize, false);
		document.addEventListener('mousedown', onDocumentMouseDown, false);

		// create a globe representing the earth
		earth = new Globe({
			texture: 'assets/img/world_4k.jpg',
			radius: 300
		});
		scene.add(earth);

		var axisHelper = new THREE.AxisHelper(earth.geometry.radius*2);
		scene.add(axisHelper);

		var numberOfPoints = 50;
		var flux = new Flux(earth, numberOfPoints);

		// some basic materials
		//var material = new THREE.LineBasicMaterial({color: 'red', linewidth: 1});
		//var material = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 3, gapSize: 1, linewidth: 2});

		// texture passed to the shader
		var shaderTexture = THREE.ImageUtils.loadTexture('assets/img/texture.16.png');
		shaderTexture.wrapS = THREE.RepeatWrapping;
		shaderTexture.wrapT = THREE.RepeatWrapping;

		// manipulated uniforms in the shaders
		uniforms = {
			color: {type: 'c', value: new THREE.Color(0xff0000)},
			texture: {type: 't', value: shaderTexture},
			displacement: {type: 'f', value: 0.0}
		};

		// shader material
		var material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: Shaders.vertex1,
			fragmentShader: Shaders.fragment1,
			blending: THREE.AdditiveBlending,
			depthTest: true,
			depthWrite: false,
			transparent: true,
			linewidth: 1
		});

		// start constructing the lines
		var home = {latitude:47.21176, longitude:-1.57300};
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/capitals.json', true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				var current;
				for (var i = 0; i < data.length; i++) {
					current = data[i];
					//uniforms.displacement.value = i/data.length;
					var doubleCubicFlux = flux.doubleCubicFlux(home.latitude, home.longitude, current.latitude, current.longitude);
					var currentFlux = new THREE.Line(doubleCubicFlux, material);//, THREE.LinePieces);
					scene.add(currentFlux);
				}
			}
		};
		xhr.send(null);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}

	function onDocumentMouseDown(event) {
		var gl = renderer.context;
		// mouse coords converted in -1/+1 where center is the center of the window
		var mouseX = (event.clientX / gl.canvas.clientWidth) * 2 - 1;
		var mouseY = -(event.clientY / gl.canvas.clientHeight) * 2 + 1;
		var vector = new THREE.Vector3(mouseX, mouseY, camera.near);
		// convert the [-1, 1] screen coordinate into a world coordinate on the near plane
		var projector = new THREE.Projector();
		projector.unprojectVector(vector, camera);
		// ray cast from camera to vector deduced by the click
		var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
		// see if the ray from the camera into the world hits the globe
		var intersects = raycaster.intersectObject(earth, true);
		// if there is one (or more) intersections
		if (intersects.length > 0) {
			var position = intersects[0].point;
			var latLon = GeoUtils.xyzToLatLon(position, earth);
			GeoUtils.getCountryCodeFromOSM(latLon.lat, latLon.lon, function(country) {
				console.log(country);
			});
			var geometry = new THREE.CubeGeometry(1,1,1);
			var material = new THREE.MeshBasicMaterial({color: 'red'});
			var cube = new THREE.Mesh(geometry, material);
			cube.position = position;
			scene.add(cube);
		}
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();
		controls.update();
	}

	function render() {
		// play with the parameter that moves the texture
		uniforms.displacement.value += guiControls.speed;
		// play with color
		uniforms.color.value = new THREE.Color(guiControls.color);
		// tell the renderer to do its job: RENDERING!
		renderer.render(scene, camera);
	}

	function drawBorders() {
		var bordersGeometry = new THREE.Geometry();
		var material = new THREE.LineBasicMaterial({color: 'red', linewidth: 1});
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/countries.geo.json', true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				var countries = data.features;
				for (var i=0; i<countries.length;i++) {
					var country = countries[i];
					var geometry = GeoUtils.geoJsonToGeometry(country, earth);
					THREE.GeometryUtils.merge(bordersGeometry, geometry);
					console.log(i + ' : added ' + country.properties.name + ' : ' + country.geometry.type);
				}
				var mesh = new THREE.Line(bordersGeometry, material, THREE.LinePieces);
				scene.add(mesh);
			}
		};
		xhr.send(null);
	}

})();