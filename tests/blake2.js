"use strict";

const blake2 = require('../build/Release/blake2');
const assert = require('assert');

const BLAKE2B_EMPTY_DIGEST_HEX = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';
const BLAKE2B_EMPTY_DIGEST_BASE64 = new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('base64');

describe('BLAKE2bHash', function() {
	it('should return correct digest after 0 updates', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
	});

	it('should return a Buffer when digest() is called without args', function() {
		let hash = blake2.BLAKE2bHash();
		assert.deepEqual(hash.digest(), new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex'));
	});

	it('should return a base64 string when digest("base64") is called', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('base64'), BLAKE2B_EMPTY_DIGEST_BASE64);
	});

	it('throws Error if digest() is called a second or third time', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() {
			hash.digest();
		}, "Not initialized");
		assert.throws(function() {
			hash.digest();
		}, "Not initialized");
	});

	it('throws Error if update(...) is called a second or third time', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() {
			hash.update('hi');
		}, "Not initialized");
		assert.throws(function() {
			hash.update(new Buffer('hi'));
		}, "Not initialized");
	});
});
