(function () {
	'use strict';
	var Shaders = {};
	
	// noop vertex shader
	Shaders.noopVertex = `
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

	Shaders.globeFragment = `
		uniform sampler2D texture;
		uniform sampler2D index;
		uniform float clicked;
		uniform vec3 color;
		varying vec2 vUv;

		void main() {
			vec4 currentTexture = texture2D(texture, vUv);
			vec4 currentIndex = texture2D(index, vUv);
			float fader = 0.0;
			if (clicked-currentIndex.r<0.0035 
				&& currentIndex.r-clicked<0.0035
				&& clicked/currentIndex.r >0.0) fader = 0.7;
			gl_FragColor = mix(currentTexture, vec4(color,0.7), fader);
		}
	`;

	// tie this object to the global window one
	window.Shaders = Shaders;
})();