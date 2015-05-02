"use strict";

const blake2 = require('../build/Release/blake2');
const assert = require('assert');
const fs = require('fs');

const BLAKE2B_EMPTY_DIGEST_HEX = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';
const BLAKE2B_EMPTY_DIGEST_BASE64 = new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('base64');
const BLAKE2B_EMPTY_DIGEST_BINARY = new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('binary');

describe('BLAKE2bHash', function() {
	it('should return correct digest after 0 updates', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
	});

	it('should return a Buffer when digest() is called without args', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.deepEqual(hash.digest(), new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex'));
	});

	it('should return a base64 string when digest("base64") is called', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.equal(hash.digest('base64'), BLAKE2B_EMPTY_DIGEST_BASE64);
	});

	it('should return a binary string when digest("binary") is called', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.equal(hash.digest('binary'), BLAKE2B_EMPTY_DIGEST_BINARY);
	});

	it('throws Error if digest() is called a second or third time', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() {
			hash.digest();
		}, "Not initialized");
		assert.throws(function() {
			hash.digest();
		}, "Not initialized");
	});

	it('throws Error if update(...) is called a second or third time', function() {
		const hash = new blake2.BLAKE2Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() {
			hash.update('hi');
		}, "Not initialized");
		assert.throws(function() {
			hash.update(new Buffer('hi'));
		}, "Not initialized");
	});

	it('should work with .pipe()', function(done) {
		const f = fs.openSync('temp1mb', 'w');
		fs.writeSync(f, '\x00'.repeat(1024*1024));
		fs.closeSync(f);

		const stream = fs.createReadStream('temp1mb');
		const hash = new blake2.BLAKE2Hash('blake2b');
		hash.setEncoding('hex');

		stream.on('end', function() {
			hash.end();
			let digest = hash.read();
			console.log(digest);
			done();
		});

		stream.pipe(hash);
	});

	it('should throw Error if called without new', function() {
		assert.throws(function() {
			blake2.BLAKE2Hash('blake2b');
		}, "must be called with new");
	});

	it('should throw Error if called without algorithm name', function() {
		assert.throws(function() {
			new blake2.BLAKE2Hash();
		}, "Expected");
	});

	it('should throw Error if called with non-string algorithm name', function() {
		assert.throws(function() {
			new blake2.BLAKE2Hash(3);
		}, "must be a string");
	});

	it('should throw Error if called with unsupported algorithm name', function() {
		assert.throws(function() {
			new blake2.BLAKE2Hash('blah');
		}, "must be blake2b");
	});
});
