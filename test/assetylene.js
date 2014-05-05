var assert = require('assert');
var join = require('path').join;
var r = require('supertest');
var s = require('../assetylene')();

describe('assetylene', function() {
	before(function(done) {
		// File
		s.add({filename: 'test/testdata/robots.txt'});
		// Prefixed file
		s.add({filename: 'test/testdata/wut.txt', prefix: '/public/'});
		// Absolute file
		s.add({filename: join(__dirname, 'testdata/abs.txt')});

		// JS and absolute
		s.add({files: [
			'test/testdata/script1.js',
			join(__dirname, 'testdata/script2.js')
		]});
		// Prefixed CSS
		s.add({files: [
			'test/testdata/style.css',
			'test/testdata/font.css'
		], prefix: '/css/'});

		// Directory
		s.add({directory: 'test/testdata/dir'});
		// Prefixed directory
		s.add({directory: 'test/testdata/dir2', prefix: '/dir2/'});
		// Absolute directory
		s.add({directory: join(__dirname, 'testdata/absdir')});

		s.on('ready', done);
	});

	describe('.url', function() {
		it('should get hash url from name', function() {
			var h = s.url('wut.txt');
			assert.equal(h, '/public/wut-a0bdc0989c1bc942.txt');
		});

		it('gets a prefixed minification', function() {
			assert.equal(s.url('style.css'), '/css/style-4fe4f5aabd9887b2.css');
		});

		it('should get null from invalid name', function() {
			assert.equal(s.url('wuttest.txt'), null);
		});
	});

	describe('.FileAsset', function() {
		it('serves a root file', function(done) {
			r(s).get(s.url('robots.txt'))
				.expect('Vary', 'Accept-Encoding')
				.expect('Cache-Control', 'public, max-age=31536000')
				.expect('Content-Type', 'text/plain')
				.expect(200, 'wutwutwutwutwutwutwutwutwutwut\n', done);
		});

		it('serves a compressed file', function(done) {
			r(s).get(s.url('robots.txt'))
				.set('Accept-Encoding', 'gzip, deflate')
				.expect('Content-Encoding', 'gzip')
				.expect(200, 'wutwutwutwutwutwutwutwutwutwut\n', done);
		});

		it('serves a prefixed file', function(done) {
			r(s).get(s.url('wut.txt'))
				.expect(200, 'tgf\n', done);
		});

		it('serves an absolute file', function(done) {
			r(s).get(s.url('abs.txt'))
				.expect(200, 'abs\n', done);
		});

		it('sends only headers from HEAD', function(done) {
			r(s).head(s.url('wut.txt'))
				.expect(200, '', done);
		});

		it('serves a non-hash file', function(done) {
			r(s).get('/public/wut.txt')
				.expect(200, 'tgf\n', done);
		});
	});

	describe('.JSAsset', function() {
		it('serves minified js', function(done) {
			r(s).get(s.url('script.js'))
				.expect(200, 'function v(){var t=3;test=t}var test=1;', done);
		});
	});

	describe('.CSSAsset', function() {
		it('serves minified css', function(done) {
			r(s).get(s.url('style.css'))
				.expect(200, 'body{color:#f44}*{font-family:sans-serif}', done);
		});
	});

	describe('.AssetDirectory', function() {
		it('serves directory file', function(done) {
			r(s).get(s.url('file1.cc'))
				.expect(200, 'jpeg\n', done);
		});

		it('serves other directory file', function(done) {
			r(s).get(s.url('file2.asc'))
				.expect(200, 'f\n', done);
		});

		it('serves prefixed directory file', function(done) {
			r(s).get(s.url('notes.txt'))
				.expect(200, 'gh\n', done);
		});

		it('serves absolute directory file', function(done) {
			r(s).get(s.url('index.html'))
				.expect(200, 'no\n', done);
		});
	});

	describe('method handling', function() {
		it('sends 405 on DELETE', function(done) {
			r(s).del(s.url('wut.txt'))
				.expect(405, 'Method not allowed', done);
		});

		it('sends 405 on PUT', function(done) {
			r(s).put(s.url('wut.txt'))
				.expect(405, 'Method not allowed', done);
		});
	});

	describe('cache handling', function() {
		describe('hashed files', function() {
			it('sends 304 on modified since', function(done) {
				r(s).get(s.url('wut.txt'))
					.set('If-Modified-Since', new Date().toGMTString())
					.expect(304, '', done);
			});

			it('sends 304 on invalid modified since', function(done) {
				r(s).get(s.url('wut.txt'))
					.set('If-Modified-Since', 'uiyukhjvbhjdsf')
					.expect(304, '', done);
			});

			it('sends 304 on matching etag', function(done) {
				r(s).get(s.url('wut.txt'))
					.set('If-None-Match', 'a0bdc0989c1bc942')
					.expect(304, '', done);
			});

			it('sends 304 on invalid etag', function(done) {
				r(s).get(s.url('wut.txt'))
					.set('If-None-Match', 'fadskjfksdhf')
					.expect(304, '', done);
			});
		});
		
		describe('non-hashed files', function() {
			it('sends 304 on modified since', function(done) {
				r(s).get('/public/wut.txt')
					.set('If-Modified-Since', new Date(Date.now() + 5000).toGMTString())
					.expect(304, '', done);
			});

			it('sends 200 on invalid modified since', function(done) {
				r(s).get('/public/wut.txt')
					.set('If-Modified-Since', 'uiyukhjvbhjdsf')
					.expect(200, 'tgf\n', done);
			});

			it('sends 304 on matching etag', function(done) {
				r(s).get('/public/wut.txt')
					.set('If-None-Match', 'a0bdc0989c1bc942')
					.expect(304, '', done);
			});

			it('sends 200 on wrong etag', function(done) {
				r(s).get('/public/wut.txt')
					.set('If-None-Match', 'fadskjfksdhf')
					.expect(200, 'tgf\n', done);
			});
		});
	});

	describe('last case handling', function() {
		it('sends 404 on invalid url', function(done) {
			r(s).get('/wutup.txt')
				.expect(404, 'File not found', done);
		});
	});
});
