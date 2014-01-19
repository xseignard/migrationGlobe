(function() {
	'use strict';
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var container, stats, camera, controls, scene, renderer;

	init();
	animate();

	function init() {
		// setup of camera, controls, stats, renderer and scene
		container = document.getElementById('container');
		var width = window.innerWidth;
		var height = window.innerHeight;

		camera = new THREE.PerspectiveCamera(45, width/height, 1, 2000);
		camera.position.z = 1500;

		controls = new THREE.OrbitControls(camera);
		controls.minDistance = 500;
		controls.maxDistance = 2000;
		controls.addEventListener('change', render);

		stats = new Stats();
		document.body.appendChild(stats.domElement);

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(width, height);
		renderer.domElement.style.position = 'absolute';
		container.appendChild(renderer.domElement);

		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x111111, 1800, 2000);

		window.addEventListener('resize', onWindowResize, false);

		// create a globe representing the earth
		var earth = new Globe({
			texture: 'assets/img/world_4k.jpg'
		});
		scene.add(earth);
		var flux = new Flux(earth);

		var home = {latitude:47.21176, longitude:-1.57300};
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/capitals.json', true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				var current;
				for (var i = 0; i < 5; i++) {
					current = data[i];
					console.log(current.capital);
					var quadraticFlux = flux.quadraticFlux(home.latitude, home.longitude, current.latitude, current.longitude);
					var cubicFlux = flux.cubicFlux(home.latitude, home.longitude, current.latitude, current.longitude);
					var doubleCubicFlux = flux.doubleCubicFlux(home.latitude, home.longitude, current.latitude, current.longitude);
					scene.add(quadraticFlux);
					scene.add(cubicFlux);
					scene.add(doubleCubicFlux);
					render();
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

	function animate() {
		requestAnimationFrame(animate);
		controls.update();
	}

	function render() {
		renderer.render(scene, camera);
		stats.update();
	}

})();