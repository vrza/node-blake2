"use strict";

const blake2 = require('../index');
const binding = require('../build/Release/binding');
const assert = require('assert');
const fs = require('fs');
const os = require('os');

const BLAKE2B_EMPTY_DIGEST_HEX = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';
const BLAKE2B_EMPTY_DIGEST_BASE64 = new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('base64');
const BLAKE2B_EMPTY_DIGEST_BINARY = new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('binary');

const BLAKE2S_EMPTY_DIGEST_HEX = '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9';
const BLAKE2S_EMPTY_DIGEST_BASE64 = new Buffer(BLAKE2S_EMPTY_DIGEST_HEX, 'hex').toString('base64');
const BLAKE2S_EMPTY_DIGEST_BINARY = new Buffer(BLAKE2S_EMPTY_DIGEST_HEX, 'hex').toString('binary');

/**
 * Parse the test vectors from a BLAKE2 test vector file
 */
function* getTestVectors(file) {
	let content = fs.readFileSync(file, 'ascii').replace(/^\n+/, "");
	// The official BLAKE2 test vector files strangely end with "ok"
	assert(content.endsWith("ok\n"));
	content = content.replace(/ok\n$/, "");
	let parts = content.split('\n\n');
	for(let part of parts) {
		let lines = part.split('\n');
		let input = new Buffer(lines[0].replace(/^in:\s+/, ""), "hex");
		let key, hash;
		if(lines.length == 3) {
			key = new Buffer(lines[1].replace(/^key:\s+/, ""), "hex");
			assert(key.length == 64 || key.length == 32, key.length);
			hash = new Buffer(lines[2].replace(/^hash:\s+/, ""), "hex");
		} else {
			hash = new Buffer(lines[1].replace(/^hash:\s+/, ""), "hex");
		}
		assert(hash.length == 64 || hash.length == 32, hash.length);
		yield {input, key, hash};
	}
}

describe('blake2', function() {
	it('returns correct digest for blake2b after 0 updates', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
	});

	it('returns correct digest for blake2s after 0 updates', function() {
		const hash = new blake2.Hash('blake2s');
		assert.equal(hash.digest('hex'), BLAKE2S_EMPTY_DIGEST_HEX);
	});

	it('returns a Buffer when digest() is called without args', function() {
		const hash = new blake2.Hash('blake2b');
		assert.deepEqual(hash.digest(), new Buffer(BLAKE2B_EMPTY_DIGEST_HEX, 'hex'));
	});

	it('returns a base64 string when digest("base64") is called', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('base64'), BLAKE2B_EMPTY_DIGEST_BASE64);
	});

	it('returns a binary string when digest("binary") is called', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('binary'), BLAKE2B_EMPTY_DIGEST_BINARY);
	});

	it('throws Error if digest() is called a second or third time', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() { hash.digest(); }, /Not initialized/);
		assert.throws(function() { hash.digest(); }, /Not initialized/);
	});

	it('throws Error if update(...) is called after digest()', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
		assert.throws(function() { hash.update(new Buffer('hi')); }, /Not initialized/);
		assert.throws(function() { hash.update(new Buffer('hi')); }, /Not initialized/);
	});

	it('throws Error if update(...) is called with a non-Buffer', function() {
		const hash = new blake2.Hash('blake2b');
		assert.throws(function() { hash.update('hi'); }, /need a Buffer/);
		assert.throws(function() { hash.update(3); }, /need a Buffer/);
		assert.throws(function() { hash.update(null); }, /need a Buffer/);
		assert.throws(function() { hash.update(); }, /need a Buffer/);
	});

	it('works with .pipe()', function(done) {
		const tempfname = `${os.tmpdir()}/temp1mb`;
		const f = fs.openSync(tempfname, 'w');
		fs.writeSync(f, '\x00'.repeat(1024*1024));
		fs.closeSync(f);

		const stream = fs.createReadStream(tempfname);
		const hash = new blake2.Hash('blake2b');
		hash.setEncoding('hex');

		stream.on('end', function() {
			hash.end();
			const digest = hash.read();
			assert.equal(digest, 'a834b19291e54808ba8367ca60e6abd9c744138541284b12bb6caa532fae419b063c26022121148fef68a7d8dc0fa83eb2f00454138c1c54753f7148f6911e0d');
			done();
		});

		stream.pipe(hash);
	});

	it('throws Error if called without algorithm name', function() {
		assert.throws(function() { new blake2.Hash(); }, /must be a string/);
		assert.throws(function() { new blake2.Hmac(); }, /must be a string/);
	});

	it('throws Error if called with non-string algorithm name', function() {
		assert.throws(function() { new blake2.Hash(3); }, /must be a string/);
		assert.throws(function() { new blake2.Hmac(3); }, /must be a string/);
	});

	it('throws Error if called with unsupported algorithm name', function() {
		assert.throws(function() { new blake2.Hash('blah'); }, /must be/);
		assert.throws(function() { new blake2.Hmac('blah'); }, /must be/);
	});

	it('throws Error if called with String key', function() {
		assert.throws(function() { new blake2.Hmac('blake2b', 'key'); }, /must be/);
	});

	describe('blake2b', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.Hmac('blake2b', new Buffer('x'.repeat(64 + 1), "ascii"));
			}, /must be 64 bytes or smaller/);
		});
	});

	describe('blake2bp', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.Hmac('blake2bp', new Buffer('x'.repeat(64 + 1), "ascii"));
			}, /must be 64 bytes or smaller/);
		});
	});

	describe('blake2s', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.Hmac('blake2s', new Buffer('x'.repeat(32 + 1), "ascii"));
			}, /must be 32 bytes or smaller/);
		});
	});

	describe('blake2sp', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.Hmac('blake2sp', new Buffer('x'.repeat(32 + 1), "ascii"));
			}, /must be 32 bytes or smaller/);
		});
	});

	it('returns the correct result for all keyed test vectors', function() {
		for(let algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/keyed/${algo}-test.txt`);
			for(let v of vectors) {
				let hmac = blake2.createHmac(algo, v.key);
				hmac.update(v.input);
				let digest = hmac.digest();
				assert.deepEqual(digest, v.hash);
			}
		}
	});

	it('returns the correct result for all unkeyed test vectors', function() {
		for(let algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/unkeyed/${algo}-test.txt`);
			for(let v of vectors) {
				let hash = blake2.createHash(algo);
				hash.update(v.input);
				let digest = hash.digest();
				assert.deepEqual(digest, v.hash);
			}
		}
	});
});

describe('binding', function() {
	it('throws Error if called without "new"', function() {
		assert.throws(function() {
			binding.Hash('blake2b');
		}, /must be called with new/);
	});
});
