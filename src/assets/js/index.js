(function() {
	'use strict';
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var home = {latitude:47.21176, longitude:-1.57300};

	var data, flux, fluxMaterial, material, container, stats, camera, controls, scene, renderer, earth, width, height;

	var globeUniforms, fluxUniforms;

	var originX, originY;

	var GuiControls = function() {
		this.speed = 0.004;
		this.fluxColor = '#913113';
		this.clickColor = '#464ea2';
		this.countryColor = '#242ec5';
		this.borderColor = '#2237ff';
	};

	var guiControls = new GuiControls();

	init();
	animate();

	function init() {
		// setup of camera, controls, stats, renderer and scene
		container = document.getElementById('container');
		width = window.innerWidth;
		height = window.innerHeight;

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
		gui.addColor(guiControls, 'fluxColor');
		gui.addColor(guiControls, 'clickColor');
		gui.addColor(guiControls, 'countryColor');
		gui.addColor(guiControls, 'borderColor');

		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setSize(width, height);
		renderer.domElement.style.position = 'absolute';
		container.appendChild(renderer.domElement);

		window.addEventListener('resize', onWindowResize, false);
		document.addEventListener('mouseup', onDocumentMouseUp, false);
		document.addEventListener('mousedown', onDocumentMouseDown, false);

		// create a globe representing the earth
		// load from pngs
		var worldMap = THREE.ImageUtils.loadTexture('assets/img/world_4k_bw.png');
		var bordersMap = THREE.ImageUtils.loadTexture('assets/img/borders_map.png');
		var continentsMap = THREE.ImageUtils.loadTexture('assets/img/continents_map.png');
		var indexMap = THREE.ImageUtils.loadTexture('assets/img/indexed_map.png');

		indexMap.magFilter = THREE.NearestFilter;
		indexMap.minFilter = THREE.NearestFilter;

		globeUniforms = {
			worldMap: {type: 't', value: worldMap},
			bordersMap: {type: 't', value: bordersMap},
			continentsMap: {type: 't', value: continentsMap},
			indexMap: {type: 't', value: indexMap},
			clicked: {type: 'f', value: 0.0},
			clickColor: {type: 'c', value: new THREE.Color(0xff0000)},
			countryColor: {type: 'c', value: new THREE.Color(0xff0000)},
			borderColor: {type: 'c', value: new THREE.Color(0xff0000)},
		};
		var globeMaterial = new THREE.ShaderMaterial({
			uniforms: globeUniforms,
			vertexShader: Shaders.noopVertex,
			fragmentShader: Shaders.globeFragment
		});
		earth = new Globe({
			radius: 400,
			material: globeMaterial
		});
		scene.add(earth);

		var numberOfPoints = 50;
		flux = new Flux(earth, numberOfPoints);

		// some basic materials
		//material = new THREE.LineBasicMaterial({color: 'red', linewidth: 1});
		//material = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 3, gapSize: 1, linewidth: 2});
		material = new THREE.MeshBasicMaterial();
		material.side = THREE.DoubleSide;

		// texture passed to the shader
		var shaderTexture = THREE.ImageUtils.loadTexture('assets/img/texture.16.png');
		shaderTexture.wrapS = THREE.RepeatWrapping;
		shaderTexture.wrapT = THREE.RepeatWrapping;

		// manipulated uniforms in the shaders
		fluxUniforms = {
			color: {type: 'c', value: new THREE.Color(0xff0000)},
			texture: {type: 't', value: shaderTexture},
			displacement: {type: 'f', value: 0.0}
		};

		// shader material
		fluxMaterial = new THREE.ShaderMaterial({
			uniforms: fluxUniforms,
			vertexShader: Shaders.noopVertex,
			fragmentShader: Shaders.fluxFragment,
			blending: THREE.AdditiveBlending,
			depthTest: true,
			depthWrite: false,
			transparent: true
		});

		// start constructing the lines
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/capitals.json', true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				data = JSON.parse(xhr.responseText);
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
		// store the beginning coordinates of a click
		// to check if it's a drag or not
		originX = event.clientX;
		originY = event.clientY;
	}

	function onDocumentMouseUp(event) {
		// if the drag is longer than 3 pixels (x and y axis), it's just a drag, not a click
		if (Math.abs(originX - event.clientX) > 3 && Math.abs(originY - event.clientY) > 3) {
			return;
		}
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
			GeoUtils.getIndex(position, earth, function(index) {
				globeUniforms.clicked.value = index/255;
				GeoUtils.getCountryCodeFromIndex(index, function(country) {
					if (country) {
						cameraTo(position);
						console.log(country);
						// remove previous flux
						//scene.remove(currentFlux);
						// create new flux
						var currentFlux = flux.ThreeDFlux(home.latitude, home.longitude, country.latitude, country.longitude);
						//currentFlux = new THREE.Line(currentFlux, fluxMaterial);//, THREE.LinePieces);
						currentFlux = new THREE.Mesh(currentFlux, material);
						scene.add(currentFlux);
					}
				});
			});
		}
	}

	function cameraTo(position) {
		// compute the target position of the camera
		var dist = new THREE.Vector3().subVectors(camera.position, earth.position).length();
		var target = position.multiplyScalar(dist/earth.geometry.radius);
		// tween the camera orginal position to the target position
		var orig = camera.position.clone();
		var tween = new TWEEN.Tween(orig).to(target, 500);
		tween.easing(TWEEN.Easing.Quadratic.InOut);
		tween.onUpdate(function(){
			// the new camera position is the new orig value, multiplied by the
			// distance between the center of the globe and the camera
			camera.position = orig.clone().sub(earth.position).normalize().multiplyScalar(dist);
		});
		tween.start();
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();
		controls.update();
		TWEEN.update();
	}

	function render() {
		// play with the parameter that moves the texture
		fluxUniforms.displacement.value += guiControls.speed;
		// play with color
		fluxUniforms.color.value = new THREE.Color(guiControls.fluxColor);
		globeUniforms.clickColor.value = new THREE.Color(guiControls.clickColor);
		globeUniforms.countryColor.value = new THREE.Color(guiControls.countryColor);
		globeUniforms.borderColor.value = new THREE.Color(guiControls.borderColor);
		// tell the renderer to do its job: RENDERING!
		renderer.render(scene, camera);
	}

})();
