var fs = require('fs');
var createAsset = require('./asset');

/*
filename - path to file
*/
function createFileAsset(opts, cb) {
	opts.name = path.basename(opts.filename);

	fs.readFile(opts.filename, function(err, data) {
		if(err) throw err;

		opts.content = data;

		createAsset(opts, cb);
	}.bind(this));
}

module.exports = FileAsset;
