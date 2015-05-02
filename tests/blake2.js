"use strict";

const blake2 = require('../build/Release/blake2');
const assert = require('assert');

const BLAKE2B_EMPTY_DIGEST = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';

describe('BLAKE2bHash', function() {
	it('should return correct digest after 0 updates', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST);
	});

	it('should return a Buffer when digest() is called without args', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest(), new Buffer(BLAKE2B_EMPTY_DIGEST, 'hex'));
	});

	it('throws Error if digest() is called a second or third time', function() {
		let hash = blake2.BLAKE2bHash();
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST);
		assert.throws(function() {
			hash.digest();
		}, "not initialized");
		assert.throws(function() {
			hash.digest();
		}, "not initialized");
	});
});
