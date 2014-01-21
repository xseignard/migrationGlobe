(function () {
	'use strict';
	var Shaders = {};
	
	// noop vertex shader
	Shaders.vertex1 = `
		void main() {
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;
	// fragment shader that change color and opacity from js uniforms
	Shaders.fragment1 = `
		uniform vec3 color;
		uniform float opacity;
		void main() {
			gl_FragColor = vec4(color, opacity);
		}
	`;

	// tie this object to the global window one
	window.Shaders = Shaders;
})();