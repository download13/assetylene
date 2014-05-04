var async = require('async');
var fs = require('fs');
var CleanCSS = require('clean-css');
var createAsset = require('./asset');

// WARNING: Don't use this to create assets while running! It might be blocking
/*
files - array of filenames
*/
function createCSSAsset(opts, cb) {
	async.map(opts.files, fs.readFile, function(err, contents) {
		if(err) {
			cb(err);
			return;
		}

		contents = contents.map(function(c) {
			return c.toString();
		});

		opts.name = opts.name || 'style.css';
		opts.content = new CleanCSS().minify(contents.join('\n'));

		createAsset(opts, cb);
	});
}

module.exports = createCSSAsset;
