var mime = require('mime');
var crypto = require('crypto');
var zlib = require('zlib');

/*
name - identifier in the form of immediate filename
type - content type
content - content to be served
prefix - path to serve file from
*/
function Asset(opts) {
	this.prefix = opts.prefix;
	this.name = opts.name;
	this.ext = path.extname(this.name);
	this.name = path.basename(this.name, this.ext);

	this.type = opts.type || mime.lookup(this.ext);

	this.buildContent(opts.content, this.emit.bind(this, 'ready'));

	//this.cache = opts.cache || 0;

	// Just compress if it saves space, don't do binary formats though
}

require('util').inherits(Asset, require('events').EventEmitter);

Asset.prototype.buildContent = function(content, cb) {
	if(!Buffer.isBuffer(content)) {
		content = new Buffer(content);
	}

	this.content = content;

	this.etag = crypto.createHash('md5').update(content).digest('hex');

	this.url = path.join(this.prefix, this.name + '-' + this.etag + this.ext);
	this.name += this.ext;

	zlib.gzip(content, function(err, zipped) {
		if(zipped.length < (content.length * 0.95)) {
			this.gzipContent = zipped;
		}
		cb();
	}.bind(this));
}

function createAsset(opts, cb) {
	var a = new Asset(opts);
	a.on('ready', function() {
		cb(a);
	});
}

module.exports = createAsset;
