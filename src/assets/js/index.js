(function() {
	'use strict';
	if (!Detector.webgl) Detector.addGetWebGLMessage();

	var container, stats, camera, controls, scene, renderer;

	var uniforms, attributes;

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
			texture: 'assets/img/world_4k.jpg',
			radius: 300
		});
		
		scene.add(earth);
		var flux = new Flux(earth);

		// some basic materials
		//var material = new THREE.LineBasicMaterial({color: 'red', linewidth: 1});
		//var material = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 3, gapSize: 1, linewidth: 2});

		// manipulated uniforms in the shaders
		uniforms = {
			opacity: {type: 'f', value: 0.7},
			color: {type: 'c', value: new THREE.Color(0xff0000)}
		};

		// shader material
		var shaderMaterial = new THREE.ShaderMaterial({
			uniforms: uniforms,
			attributes: attributes,
			vertexShader: Shaders.vertex1,
			fragmentShader: Shaders.fragment1,
			blending: THREE.AdditiveBlending,
			depthTest: true,
			transparent: true,
			linewidth: 2
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
					console.log(current.capital);
					var doubleCubicFlux = flux.doubleCubicFlux(home.latitude, home.longitude, current.latitude, current.longitude);
					var currentFlux = new THREE.Line(doubleCubicFlux, shaderMaterial, THREE.LinePieces);
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

	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();
		controls.update();
	}

	function render() {
		// play with opacity
		var time = Date.now() * 0.001;
		uniforms.opacity.value = Math.min(1, 0.5+Math.sin(time));
		// play with color
		uniforms.color.value.offsetHSL(0.0005,0,0);
		// tell the renderer to do its job: RENDERING!
		renderer.render(scene, camera);
	}

})();