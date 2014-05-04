var mime = require('mime');
var path = require('path');
var url = require('url');
var crypto = require('crypto');
var zlib = require('zlib');

/*
name - identifier in the form of immediate filename
type - content type
content - content to be served
prefix - path to serve file from
*/
function Asset(opts) {
	this.prefix = opts.prefix || '/';
	this.name = opts.name;
	this.ext = path.extname(this.name);
	this.name = path.basename(this.name, this.ext);

	this.cacheAge = opts.cache || 3600; // Default to caching for an hour

	this.type = opts.type || mime.lookup(this.ext);

	this.buildContent(opts.content, this.emit.bind(this, 'ready'));
}

require('util').inherits(Asset, require('events').EventEmitter);

Asset.prototype.buildContent = function(content, cb) {
	if(!Buffer.isBuffer(content)) {
		content = new Buffer(content);
	}

	this.content = content;

	this.etag = crypto.createHash('md5').update(content).digest('hex');

	this.url = url.resolve(this.prefix, this.name + this.ext);
	this.hashUrl = url.resolve(this.prefix, this.name + '-' + this.etag + this.ext);
	this.name += this.ext;

	zlib.gzip(content, function(err, zipped) {
		if(zipped.length < (content.length * 0.95)) {
			this.gzipContent = zipped;
		}

		this.modified = Date.now();

		cb(err);
	}.bind(this));
}

function createAsset(opts, cb) {
	var a = new Asset(opts);
	a.on('ready', function(err) {
		cb(err, a);
	});
}

module.exports = createAsset;
