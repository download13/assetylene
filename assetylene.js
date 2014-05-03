var Manager = require('./manager');

module.exports = function() {
	var m = new Manager();
	return m.serve;
}
