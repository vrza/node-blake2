"use strict";

const blake2 = require('../index');
const binding = require('../build/Release/binding');
const assert = require('assert');
const fs = require('fs');
const os = require('os');

const BLAKE2B_EMPTY_DIGEST_HEX = '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce';
const BLAKE2B_EMPTY_DIGEST_BASE64 = Buffer.from(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('base64');
const BLAKE2B_EMPTY_DIGEST_BINARY = Buffer.from(BLAKE2B_EMPTY_DIGEST_HEX, 'hex').toString('binary');

const BLAKE2S_EMPTY_DIGEST_HEX = '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9';
const BLAKE2S_EMPTY_DIGEST_BASE64 = Buffer.from(BLAKE2S_EMPTY_DIGEST_HEX, 'hex').toString('base64');
const BLAKE2S_EMPTY_DIGEST_BINARY = Buffer.from(BLAKE2S_EMPTY_DIGEST_HEX, 'hex').toString('binary');

const BLAKE2B_TEST_DIGEST_16_HEX = '44a8995dd50b6657a037a7839304535b';
const BLAKE2BP_TEST_DIGEST_16_HEX = 'b05d873b25b38f2a87544dc6c7fad04d';
const BLAKE2S_TEST_DIGEST_16_HEX = 'e9ddd9926b9dcb382e09be39ba403d2c';
const BLAKE2SP_TEST_DIGEST_16_HEX = 'ef8ec7f654a5c35898b7b0e4ab13c174';

/**
 * Parse the test vectors from a BLAKE2 test vector file
 */
function* getTestVectors(file) {
	let content = fs.readFileSync(file, 'ascii').replace(/^\n+/, "");
	// The official BLAKE2 test vector files strangely end with "ok"
	assert(content.endsWith("ok\n"));
	content = content.replace(/ok\n$/, "");
	let parts = content.split('\n\n');
	for(const part of parts) {
		let lines = part.split('\n');
		let input = Buffer.from(lines[0].replace(/^in:\s+/, ""), "hex");
		let key, hash;
		if(lines.length === 3) {
			key = Buffer.from(lines[1].replace(/^key:\s+/, ""), "hex");
			assert(key.length === 64 || key.length === 32, key.length);
			hash = Buffer.from(lines[2].replace(/^hash:\s+/, ""), "hex");
		} else {
			hash = Buffer.from(lines[1].replace(/^hash:\s+/, ""), "hex");
		}
		assert(hash.length === 64 || hash.length === 32, hash.length);
		yield {input, key, hash};
	}
}

describe('blake2', function() {
	it('returns correct digest for blake2b after 0 updates', function() {
		const hash = new blake2.Hash('blake2b');
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
	});

	it('returns correct digest for blake2b after 0 updates, with digestLength parameter', function() {
		const hash = new blake2.Hash('blake2b', {digestLength: 64});
		assert.equal(hash.digest('hex'), BLAKE2B_EMPTY_DIGEST_HEX);
	});

	it('returns correct digest for blake2s after 0 updates', function() {
		const hash = new blake2.Hash('blake2s');
		assert.equal(hash.digest('hex'), BLAKE2S_EMPTY_DIGEST_HEX);
	});

	it('returns correct digest for blake2s after 0 updates, with digestLength parameter', function() {
		const hash = new blake2.Hash('blake2s', {digestLength: 32});
		assert.equal(hash.digest('hex'), BLAKE2S_EMPTY_DIGEST_HEX);
	});

	it('returns a Buffer when digest() is called without args', function() {
		const hash = new blake2.Hash('blake2b');
		assert.deepEqual(hash.digest(), Buffer.from(BLAKE2B_EMPTY_DIGEST_HEX, 'hex'));
	});

	it('returns a base64 string when digest("base64") is called', function() {
		assert.equal(new blake2.Hash('blake2b').digest('base64'), BLAKE2B_EMPTY_DIGEST_BASE64);
		assert.equal(new blake2.Hash('blake2s').digest('base64'), BLAKE2S_EMPTY_DIGEST_BASE64);
	});

	it('returns a binary string when digest("binary") is called', function() {
		assert.equal(new blake2.Hash('blake2b').digest('binary'), BLAKE2B_EMPTY_DIGEST_BINARY);
		assert.equal(new blake2.Hash('blake2s').digest('binary'), BLAKE2S_EMPTY_DIGEST_BINARY);
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
		assert.throws(function() { hash.update(Buffer.from('hi')); }, /Not initialized/);
		assert.throws(function() { hash.update(Buffer.from('hi')); }, /Not initialized/);
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
		assert.throws(function() { new blake2.KeyedHash(); }, /must be a string/);
	});

	it('throws Error if called with non-string algorithm name', function() {
		assert.throws(function() { new blake2.Hash(3); }, /must be a string/);
		assert.throws(function() { new blake2.KeyedHash(3); }, /must be a string/);
	});

	it('throws Error if called with unsupported algorithm name', function() {
		assert.throws(function() { new blake2.Hash('blah'); }, /must be/);
		assert.throws(function() { new blake2.KeyedHash('blah'); }, /must be/);
	});

	it('throws Error if called with String key', function() {
		assert.throws(function() { new blake2.KeyedHash('blake2b', 'key'); }, /must be/);
	});

	describe('blake2b', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.KeyedHash('blake2b', Buffer.from('x'.repeat(64 + 1), "ascii"));
			}, /must be 64 bytes or smaller/);
		});
		it('throws Error if called with a non-numeric digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2b', {digestLength: 'not a number'});
			}, /must be a number/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2b', Buffer.from('key'), {digestLength: 'not a number'});
			}, /must be a number/);
		});
		it('throws Error if called with a too large digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2b', {digestLength: 65});
			}, /must be between 1 and 64/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2b', Buffer.from('key'), {digestLength: 65});
			}, /must be between 1 and 64/);
		});
		it('throws Error if called with a too small digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2b', {digestLength: 0});
			}, /must be between 1 and 64/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2b', Buffer.from('key'), {digestLength: 0});
			}, /must be between 1 and 64/);
		});
		it('returns the correct hash for a 16 byte digestLength', function() {
			const hash = new blake2.Hash('blake2b', {digestLength: 16});
			hash.update(Buffer.from('test'));
			assert.equal(hash.digest('hex'), BLAKE2B_TEST_DIGEST_16_HEX);
		});
		it('returns the correct hash for a 1 byte digestLength', function() {
			const hash = new blake2.Hash('blake2b', {digestLength: 1});
			hash.update(Buffer.from('test'));
			assert.equal(hash.digest('hex'), 'f7');
		});
		it('returns the correct hash for a 1 byte digestLength after being copied', function() {
			const hash = new blake2.Hash('blake2b', {digestLength: 1});
			hash.update(Buffer.from('test'));
			const hashCopy = hash.copy();
			assert.equal(hashCopy.digest('hex'), 'f7');
		});
	});

	describe('blake2bp', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.KeyedHash('blake2bp', Buffer.from('x'.repeat(64 + 1), "ascii"));
			}, /must be 64 bytes or smaller/);
		});
		it('throws Error if called with a non-numeric digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2bp', {digestLength: 'not a number'});
			}, /must be a number/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2bp', Buffer.from('key'), {digestLength: 'not a number'});
			}, /must be a number/);
		});
		it('throws Error if called with a too large digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2bp', {digestLength: 65});
			}, /must be between 1 and 64/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2bp', Buffer.from('key'), {digestLength: 65});
			}, /must be between 1 and 64/);
		});
		it('throws Error if called with a too small digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2bp', {digestLength: 0});
			}, /must be between 1 and 64/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2bp', Buffer.from('key'), {digestLength: 0});
			}, /must be between 1 and 64/);
		});
		it('returns the correct hash for a 16 byte digestLength', function() {
			const hash = new blake2.Hash('blake2bp', {digestLength: 16});
			hash.update(Buffer.from('test'));
			assert.equal(hash.digest('hex'), BLAKE2BP_TEST_DIGEST_16_HEX);
		});
	});

	describe('blake2s', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.KeyedHash('blake2s', Buffer.from('x'.repeat(32 + 1), "ascii"));
			}, /must be 32 bytes or smaller/);
		});
		it('throws Error if called with a non-numeric digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2s', {digestLength: 'not a number'});
			}, /must be a number/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2s', Buffer.from('key'), {digestLength: 'not a number'});
			}, /must be a number/);
		});
		it('throws Error if called with a too large digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2s', {digestLength: 33});
			}, /must be between 1 and 32/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2s', Buffer.from('key'), {digestLength: 33});
			}, /must be between 1 and 32/);
		});
		it('throws Error if called with a too small digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2s', {digestLength: 0});
			}, /must be between 1 and 32/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2s', Buffer.from('key'), {digestLength: 0});
			}, /must be between 1 and 32/);
		});
		it('returns the correct hash for a 16 byte digestLength', function() {
			const hash = new blake2.Hash('blake2s', {digestLength: 16});
			hash.update(Buffer.from('test'));
			assert.equal(hash.digest('hex'), BLAKE2S_TEST_DIGEST_16_HEX);
		});
	});

	describe('blake2sp', function() {
		it('throws Error if called with too-long key', function() {
			assert.throws(function() {
				new blake2.KeyedHash('blake2sp', Buffer.from('x'.repeat(32 + 1), "ascii"));
			}, /must be 32 bytes or smaller/);
		});
		it('throws Error if called with a non-numeric digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2sp', {digestLength: 'not a number'});
			}, /must be a number/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2sp', Buffer.from('key'), {digestLength: 'not a number'});
			}, /must be a number/);
		});
		it('throws Error if called with a too large digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2sp', {digestLength: 33});
			}, /must be between 1 and 32/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2sp', Buffer.from('key'), {digestLength: 33});
			}, /must be between 1 and 32/);
		});
		it('throws Error if called with a too small digestLength', function() {
			assert.throws(function() {
				new blake2.Hash('blake2sp', {digestLength: 0});
			}, /must be between 1 and 32/);
			assert.throws(function() {
				new blake2.KeyedHash('blake2sp', Buffer.from('key'), {digestLength: 0});
			}, /must be between 1 and 32/);
		});
		it('returns the correct hash for a 16 byte digestLength', function() {
			const hash = new blake2.Hash('blake2sp', {digestLength: 16});
			hash.update(Buffer.from('test'));
			assert.equal(hash.digest('hex'), BLAKE2SP_TEST_DIGEST_16_HEX);
		});
	});

	it('returns the correct result for all keyed test vectors', function() {
		for(const algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/keyed/${algo}-test.txt`);
			for(const v of vectors) {
				let hash = blake2.createKeyedHash(algo, v.key);
				hash.update(v.input);
				let digest = hash.digest();
				assert.deepEqual(digest, v.hash);
			}
		}
	});

	it('returns the correct result for all unkeyed test vectors', function() {
		for(const algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/unkeyed/${algo}-test.txt`);
			for(const v of vectors) {
				let hash = blake2.createHash(algo);
				hash.update(v.input);
				let digest = hash.digest();
				assert.deepEqual(digest, v.hash);
			}
		}
	});

	it('returns correct results when keyed hashes are copied', function() {
		for(const algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/keyed/${algo}-test.txt`);
			for(const v of vectors) {
				let hash = blake2.createKeyedHash(algo, v.key);
				let hashCopy = hash.copy();
				assert(hashCopy instanceof blake2.KeyedHash, ".copy() should return a KeyedHash");
				hashCopy.update(v.input);

				// hashCopy is unaffected by these updates
				hash.update(Buffer.from("noise"));
				hash.update(Buffer.from("noise"));

				const hashCopyCopy = hashCopy.copy();
				assert(hashCopyCopy instanceof blake2.KeyedHash, ".copy() should return a KeyedHash");

				assert.deepEqual(hashCopy.digest(), v.hash);
				assert.deepEqual(hashCopyCopy.digest(), v.hash);
			}
		}
	});

	it('returns correct results when unkeyed hashes are copied', function() {
		for(const algo of ['blake2b', 'blake2s', 'blake2bp', 'blake2sp']) {
			const vectors = getTestVectors(`${__dirname}/test-vectors/unkeyed/${algo}-test.txt`);
			for(const v of vectors) {
				let hash = blake2.createHash(algo);
				let hashCopy = hash.copy();
				assert(hashCopy instanceof blake2.Hash, ".copy() should return a Hash");
				hashCopy.update(v.input);

				// hashCopy is unaffected by these updates
				hash.update(Buffer.from("noise"));
				hash.update(Buffer.from("noise"));

				const hashCopyCopy = hashCopy.copy();
				assert(hashCopyCopy instanceof blake2.Hash, ".copy() should return a Hash");

				assert.deepEqual(hashCopy.digest(), v.hash);
				assert.deepEqual(hashCopyCopy.digest(), v.hash);
			}
		}
	});
});

describe('binding', function() {
	it('throws Error if called without "new"', function() {
		assert.throws(function() {
			/* eslint-disable new-cap */
			binding.Hash('blake2b');
			/* eslint-enable new-cap */
		}, /must be called with new/);
	});
});
