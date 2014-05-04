var async = require('async');
var fs = require('fs');
var UglifyJS = require('uglify-js');
var createAsset = require('./asset');

/*
files - array of filenames
*/
function createJSAsset(opts, cb) {
	async.map(opts.files, fs.readFile, function(err, contents) {
		if(err) {
			cb(err);
			return;
		}

		contents = contents.map(function(c) {
			return c.toString();
		});

		var ast = UglifyJS.parse(contents.join('\n'));
		ast.figure_out_scope();

		var compressor = UglifyJS.Compressor();
		ast = ast.transform(compressor);

		ast.figure_out_scope();
		ast.compute_char_frequency();
		ast.mangle_names();

		opts.name = opts.name || 'script.js';
		opts.content = ast.print_to_string();
		
		createAsset(opts, cb);
	});
}

module.exports = createJSAsset;
