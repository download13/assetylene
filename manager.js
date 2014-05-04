var url = require('url');
var path = require('path');

var createAsset = require('./assets/asset');
var createFileAsset = require('./assets/fileasset');
var createDirectoryAssets = require('./assets/assetdir');
var createJSAsset = require('./assets/jsasset');
var createCSSAsset = require('./assets/cssasset');

function Manager() {
	this.byUrl = {};
	this.byName = {};

	this._handleAssets = this._handleAssets.bind(this);

	this.serve = this.serve.bind(this);
	this.serve.add = this.add.bind(this);
	this.serve.url = this.url.bind(this);
}

Manager.prototype.serve = function(req, res, next) {
	var method = req.method;
	var urlpath = url.parse(req.url).pathname;

	// Only allow GET and HEAD requests
	if(method !== 'GET' && method !== 'HEAD') {
		if(next) next();
		else {
			res.writeHead(405);
			res.end('Method not allowed');
		}
		return;
	}

	var modSince = req.headers['if-modified-since'];
	var noneMatch = req.headers['if-none-match'];
	var acceptEncoding = req.headers['accept-encoding'];

	var cacheControl;

	// We cache files forever, so just assume it's got the latest version
	

	// Get the asset
	var asset = this.byUrl[urlpath];
	if(asset == null) {
		if(next) next();
		else {
			res.writeHead(404);
			res.end('File not found');
		}
		return;
	}

	// Unique file, caching is permanent
	if(urlpath === asset.hashUrl) {
		// File content never changes, assume cache is fresh
		if(modSince != null || noneMatch != null) {
			res.writeHead(304);
			res.end();
			return;
		}

		cacheControl = 'public, max-age=31536000';
	} else {
		if(modSince != null && asset.modified <= new Date(modSince).getTime()) {
			res.writeHead(304);
			res.end();
			return;
		}

		// Make sure it's the same file
		if(noneMatch != null && noneMatch === asset.etag) {
			res.writeHead(304);
			res.end();
			return;
		}

		cacheControl = 'public, max-age=' + asset.cacheAge;
	}

	// Should we use gzipped content?
	var useGzip = false;
	if(asset.gzipContent && acceptEncoding != null && acceptEncoding.indexOf('gzip') !== -1) {
		useGzip = true;
	}

	var headers = getHeaders(asset, useGzip, cacheControl);
	var content = getContent(req, asset, useGzip);

	res.writeHead(200, headers);
	res.end(content);
}

Manager.prototype.add = function(opts) {
	if(opts.buildContent) {
		this._handleAssets(null, opts);
	} else if(opts.content) {
		createAsset(opts, this._handleAssets);
	} else if(opts.filename) {
		createFileAsset(opts, this._handleAssets);
	} else if(opts.directory) {
		createDirectoryAssets(opts, this._handleAssets);
	} else if(opts.files) {
		var type = path.extname(opts.files[0]);
		if(type === '.js') {
			createJSAsset(opts, this._handleAssets);
		} else if(type === '.css') {
			createCSSAsset(opts, this._handleAssets);
		}
	}
}

Manager.prototype.url = function(name) {
	var asset = this.byName[name];
	if(asset == null) {
		return null;
	}

	return asset.hashUrl;
}

Manager.prototype._handleAssets = function(err, assets) {
	if(err) throw err;

	if(!Array.isArray(assets)) {
		assets = [assets];
	}

	assets.forEach(function(asset) {
		this.byName[asset.name] = asset;
		this.byUrl[asset.url] = asset;
		this.byUrl[asset.hashUrl] = asset;
	}, this);
}

module.exports = Manager;


function getHeaders(asset, useGzip, cacheControl) {
	var h = {
		'Vary': 'Accept-Encoding',
		'Cache-Control': cacheControl,
		'Content-Type': asset.type,
		'ETag': asset.etag
	};

	if(useGzip) {
		h['Content-Encoding'] = 'gzip';
		h['Content-Length'] = asset.gzipContent.length;
	} else {
		h['Content-Length'] = asset.content.length;
	}

	return h;
}

var emptyBuffer = new Buffer(0);
function getContent(req, asset, useGzip) {
	if(req.method === 'HEAD') {
		return emptyBuffer;
	}

	if(useGzip) {
		return asset.gzipContent;
	}

	return asset.content;
}
