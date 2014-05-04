var async = require('async');
var path = require('path');
var readdirr = require('readdir-r');
var createFileAsset = require('./fileasset');

/*
directory - path to dir
*/
function createDirectoryAssets(opts, cb) {
	readdirr(opts.directory, function(err, list) {
		if(err) {
			cb(err);
			return;
		}

		async.map(list, function(item, cb) {
			createFileAsset({
				filename: path.join(opts.directory, item),
				prefix: opts.prefix
			}, cb);
		}, cb);
	});
}

module.exports = createDirectoryAssets;
