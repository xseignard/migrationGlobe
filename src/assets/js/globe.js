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
		// indexed material
		var indexedMaterial = new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture('assets/img/map_indexed.png')});
		// create the geometry from the given options or defaults
		var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
		// create the globe with its 2 materials
		var planet = THREE.SceneUtils.createMultiMaterialObject(geometry, [material, indexedMaterial]);
		planet.rotation.y = Math.PI;
		// embed geometry
		planet.geometry = geometry;
		return planet;
	};
	// tie this object to the global window one
	window.Globe = Globe;
})();