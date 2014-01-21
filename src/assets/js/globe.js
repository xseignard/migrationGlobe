(function() {
	'use strict';
	var Globe = function(opts) {
		// compute options
		opts = opts || {};
		var radius = opts.radius || 200;
		var widthSegments = opts.widthSegments || 40;
		var heightSegments = opts.heightSegments || 30;
		// create the material from the given options or defaults
		var texture = opts.texture || 'assets/img/world.jpg';
		var textureMap = THREE.ImageUtils.loadTexture(texture);
		var material = opts.material || new THREE.MeshBasicMaterial({map:textureMap});
		// create the geometry from the given options or defaults
		var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
		
		var planet = new THREE.Mesh(geometry, material);
		planet.rotation.y = Math.PI;

		return planet;
	};
	// tie this object to the global window one
	window.Globe = Globe;
})();