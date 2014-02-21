(function() {
	'use strict';
	var Globe = function(opts) {
		// compute options
		opts = opts || {};
		var radius = opts.radius || 200;
		var widthSegments = opts.widthSegments || 40;
		var heightSegments = opts.heightSegments || 30;
		// create the material from the given options or defaults
		var material;
		if (opts.material) {
			material = opts.material;
		}
		else {
			var texture = opts.texture || 'assets/img/world_4k_bw.png';
			var textureMap = THREE.ImageUtils.loadTexture(texture);
			material = new THREE.MeshBasicMaterial({map:textureMap});
		}
		// create the geometry from the given options or defaults
		var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
		// create the globe
		var planet = new THREE.Mesh(geometry, material);
		return planet;
	};
	// tie this object to the global window one
	window.Globe = Globe;
})();
