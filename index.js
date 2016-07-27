/**
 * This file contains a modified copy of LazyTransform and Hash
 * from io.js/lib/crypto.js
 */

"use strict";

const stream = require('stream');
const binding = require('./build/Release/binding');

class LazyTransform extends stream.Transform {
	constructor(options) {
		super();
		this._options = options;
	}
}

[
	'_readableState',
	'_writableState',
	'_transformState'
].forEach(function(prop) {
	Object.defineProperty(LazyTransform.prototype, prop, {
		get: function() {
			stream.Transform.call(this, this._options);
			this._writableState.decodeStrings = false;
			this._writableState.defaultEncoding = 'binary';
			return this[prop];
		},
		set: function(val) {
			Object.defineProperty(this, prop, {
				value: val,
				enumerable: true,
				configurable: true,
				writable: true
			});
		},
		configurable: true,
		enumerable: true
	});
});


class Hash extends LazyTransform {
	constructor(algorithm, options) {
		super(options);

		let digestLength = -1;
		if (options && 'digestLength' in options) {
			digestLength = options.digestLength;
		}
		this._handle = new binding.Hash(algorithm, null, digestLength);
	}

	_transform(chunk, encoding, callback) {
		this._handle.update(chunk, encoding);
		callback();
	}

	_flush(callback) {
		this.push(this._handle.digest());
		callback();
	}

	update(buf) {
		this._handle.update(buf);
		return this;
	}

	digest(outputEncoding) {
		const buf = this._handle.digest();
		if(outputEncoding) {
			return buf.toString(outputEncoding);
		}
		return buf;
	}

	copy() {
		const h = new this.constructor("bypass");
		h._handle = this._handle.copy();
		return h;
	}
}

function createHash(algorithm, options) {
	return new Hash(algorithm, options);
}


class KeyedHash extends LazyTransform {
	constructor(algorithm, key, options) {
		super(options);

		let digestLength = -1;
		if (options && 'digestLength' in options) {
			digestLength = options.digestLength;
		}
		this._handle = new binding.Hash(algorithm, key, digestLength);
	}
}

KeyedHash.prototype.update = Hash.prototype.update;
KeyedHash.prototype.digest = Hash.prototype.digest;
KeyedHash.prototype.copy = Hash.prototype.copy;
KeyedHash.prototype._flush = Hash.prototype._flush;
KeyedHash.prototype._transform = Hash.prototype._transform;

function createKeyedHash(algorithm, key, options) {
	return new KeyedHash(algorithm, key, options);
}

module.exports = {Hash, createHash, KeyedHash, createKeyedHash};
