(function(Globe, Stats) {
	'use strict';
	var stats = new Stats();
    document.body.appendChild(stats.domElement);
    setInterval(function() {
        stats.begin();
        stats.end();
    }, 1000/60);

    var container = document.getElementById('container');
    var earth = new Globe(container, {
      texture: 'assets/img/world_4k.jpg'
    });
    var paris = {latitude:48.85, longitude:2.35};
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'assets/data/capitals.json', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        var current;
        for (var i = 0; i < data.length/5; i++) {
          current = data[i];
          if (current.country !== 'France') {
            earth.addFlux(paris.latitude, paris.longitude, current.latitude, current.longitude);
          }
        }
      }
    };
    xhr.send(null);
    earth.animate();
})(Globe, Stats);