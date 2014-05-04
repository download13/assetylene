var assert = require('assert');
var r = require('supertest');
var s = require('../assetylene')();

describe('assetylene', function() {
	before(function(done) {
		s.add({filename: 'test/testdata/wut.txt', prefix: '/public/'});
		s.add({filename: 'test/testdata/robots.txt'});

		s.add({files: ['test/testdata/script1.js', 'test/testdata/script2.js']});
		s.add({files: ['test/testdata/style.css', 'test/testdata/font.css']});

		s.add({directory: 'test/testdata/dir'});

		setTimeout(done, 500);
	});

	describe('valid request', function() {
		it('should get a root file', function(done) {
			r(s).get(s.url('robots.txt'))
				.expect('Vary', 'Accept-Encoding')
				.expect('Cache-Control', 'public, max-age=31536000')
				.expect('Content-Type', 'text/plain')
				.expect(200, 'wutwutwutwutwutwutwutwutwutwut\n', done);
		});

		it('should get a compressed file', function(done) {
			r(s).get(s.url('robots.txt'))
				.set('Accept-Encoding', 'gzip, deflate')
				.expect('Content-Encoding', 'gzip')
				.expect(200, 'wutwutwutwutwutwutwutwutwutwut\n', done);
		});

		it('should get a prefixed file', function(done) {
			r(s).get(s.url('wut.txt'))
				.expect(200, 'tgf\n', done);
		});

		it('should get minified js', function(done) {
			r(s).get(s.url('script.js'))
				.expect(200, 'function v(){var t=3;test=t}var test=1;', done);
		});

		it('should get minified css', function(done) {
			r(s).get(s.url('style.css'))
				.expect(200, 'body{color:#f44}*{font-family:sans-serif}', done);
		});

		it('should get directory file', function(done) {
			r(s).get(s.url('file1.cc'))
				.expect(200, 'jpeg\n', done);
		});

		it('should get other directory file', function(done) {
			r(s).get(s.url('file2.asc'))
				.expect(200, 'f\n', done);
		});

		it('should get only headers from HEAD', function(done) {
			r(s).head(s.url('file2.asc'))
				.expect(200, '', done);
		});
	});

	describe('invalid request', function() {
		it('should get 405 from DELETE', function(done) {
			r(s).del(s.url('wut.txt'))
				.expect(405, 'Method not allowed', done);
		});

		it('should get 405 from PUT', function(done) {
			r(s).put(s.url('wut.txt'))
				.expect(405, 'Method not allowed', done);
		});

		it('should get 304 from modified since', function(done) {
			r(s).get(s.url('wut.txt'))
				.set('If-Modified-Since', new Date().toGMTString())
				.expect(304, '', done);
		});

		it('should get 200 from wrong etag', function(done) {
			r(s).get(s.url('wut.txt'))
				.set('Etag', 'fadskjfksdhf')
				.expect(200, 'tgf\n', done);
		});

		it('should get 304 from matching etag', function(done) {
			r(s).get(s.url('wut.txt'))
				.set('If-None-Match', 'a0bdc0989c1bc942627c40d7b3eeca53')
				.expect(304, '', done);
		});
		
		it('should get 404 from invalid url', function(done) {
			r(s).get('/wutup.txt')
				.expect(404, 'File not found', done);
		});
	});

	describe('get urls', function() {
		it('should get hash url from name', function() {
			var h = s.url('wut.txt');
			assert.equal(h, '/public/wut-a0bdc0989c1bc942627c40d7b3eeca53.txt');
		});

		it('should get null from invalid name', function() {
			assert.equal(s.url('wuttest.txt'), null);
		});
	});
});
