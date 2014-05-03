var fs = require('fs');
var createAsset = require('./asset');

/*
directory - path to dir
*/
function AssetDir(opts) {
	var name = path.basename(opts.filename);

	fs.readFile(opts.filename, function(err, data) {
		if(err) throw err;

		Asset.call(this, {
			name: name,
			content: data
		});
	}.bind(this));
}




module.exports = AssetDir;
