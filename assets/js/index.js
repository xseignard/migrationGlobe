(function(Detector, DAT) {
	if(!Detector.webgl){
		Detector.addGetWebGLMessage();
	}
	else {
		// Where to put the globe?
		var container = document.getElementById('container');
		// Make the globe
		var globe = new DAT.Globe(container);
		// We're going to ask a file for the JSON data.
		var xhr = new XMLHttpRequest();
		// Where do we get the data?
		xhr.open('GET', 'assets/data/inflowFinal.json', true);
		// What do we do when we have it?
		xhr.onreadystatechange = function() {
			// If we've received the data
			if (xhr.readyState === 4 && xhr.status === 200) {
				// Parse the JSON
				var data = JSON.parse(xhr.responseText);
				// Tell the globe about your JSON data
				var adapted = [];
				for (var i = 0; i < data.length; i ++) {
					var current = data[i];
					if (current.latitude && current.longitude) {
						adapted.push(current.latitude);
						adapted.push(current.longitude);
						var dest = current.to;
						var count = 0;
						for (var j = 0; j < dest.length; j++) {
							count += parseFloat(dest[j].count[0].count);
						};
						adapted.push(count);
						console.log(current.from);
						console.log(Math.round(count*1000));
					}
				}
				globe.addData(adapted, {format:'magnitude'});
				// Create the geometry
				globe.createPoints();
				// Begin animation
				globe.animate();
				// remove loading
				document.body.style.backgroundImage = 'none';
			}
		};
		// Begin request
		xhr.send(null);
	}
})(Detector, DAT);