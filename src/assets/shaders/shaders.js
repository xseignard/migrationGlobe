(function () {
	'use strict';
	var Shaders = {};
	
	// noop vertex shader
	Shaders.vertex1 = `
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`;
	// fragment shader that change color
	// and moves a texture to get a moving effect
	Shaders.fragment1 = `
		uniform vec3 color;
		uniform sampler2D texture;
		uniform float displacement;
		varying vec2 vUv;

		void main() {
			vec4 texColor = texture2D(texture, vec2(vUv.x+displacement, vUv.y));
			gl_FragColor = texColor*vec4(color,1.0);
		}
	`;

	// tie this object to the global window one
	window.Shaders = Shaders;
})();