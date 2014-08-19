var inflows = require('./newInflows.json');

var i = 0;

inflows.forEach(function(inflow) {
	if (!inflow.index) {
		console.log(inflow.from);
		i++;
	}
});

console.log(i);
