var url = require('url');

function Manager() {
	this.byUrl = {};
	this.byName = {};

	this.serve = this.serve.bind(this);
	this.serve.add = this.add.bind(this);
	this.serve.url = this.url.bind(this);
}

Manager.prototype.serve = function(req, res, next) {
	var method = req.method;
	var path = url.parse(req.url).pathname;
	var headers = req.headers;

	// Only allow GET and HEAD requests
	if(method !== 'GET' && method !== 'HEAD') {
		if(next) next();
		else {
			res.writeHead(405);
			res.end('Method not allowed');
		}
		return;
	}

	// We cache files forever, so just assume it's got the latest version
	if(headers['if-modified-since'] != null) {
		res.writeHead(304);
		res.end();
		return;
	}

	// Get the asset
	var asset = this.byUrl[path];
	if(asset == null) {
		if(next) next();
		else {
			res.writeHead(404);
			res.end('File not found');
		}
		return;
	}

	// Make sure it's the same one, just in case
	var none = headers['if-none-match'];
	if(none != null && none === asset.etag) {
		res.writeHead(304);
		res.end();
		return;
	}

	// Should we use gzipped content?
	var useGzip = false;
	var enc = headers['accept-encoding'];
	if(this.gzipContent && enc != null && enc.indexOf('gzip') !== -1) {
		useGzip = true;
	}

	var headers = getHeaders(asset, useGzip);
	var content = getContent(req, asset, useGzip);

	res.writeHead(200, headers);
	res.end(content);
}

Manager.prototype.add = function(opts) {
	if(opts.content) {
		createAsset(opts, this._handleAssets);
	} else if(opts.filename) {
		createFileAsset(opts, this._handleAssets);
	} else if(opts.directory) {
		createDirectoryAssets(opts, this._handleAssets);
	}
}

Manager.prototype.url = function(name) {
	return this.byName[name].url;
}

Manager.prototype._handleAssets = function(assets) {
	if(!Array.isArray(assets)) {
		assets = [assets];
	}

	assets.forEach(function(asset) {
		this.byName[asset.name] = asset;
		this.byUrl[asset.url] = asset;
	}, this);
}

module.exports = Manager;


function getHeaders(asset, useGzip) {
	var h = {
		'Vary': 'Accept-Encoding',
		'Cache-Control': 'public, max-age=31536000',
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
