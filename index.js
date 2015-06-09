/**
 * This file contains a slightly-modified copy of LazyTransform and Hash
 * from io.js/lib/crypto.js
 */

"use strong";
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
].forEach(function(prop, i, props) {
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
		this._handle = new binding.Hash(algorithm);
	}
}

Hash.prototype._transform = function(chunk, encoding, callback) {
	this._handle.update(chunk, encoding);
	callback();
};

Hash.prototype._flush = function(callback) {
	this.push(this._handle.digest());
	callback();
};

Hash.prototype.update = function(buf) {
	this._handle.update(buf);
	return this;
};

Hash.prototype.digest = function(outputEncoding) {
	const buf = this._handle.digest();
	if(outputEncoding) {
		return buf.toString(outputEncoding);
	}
	return buf;
};

exports.Hash = Hash;
exports.createHash = function(algorithm, options) {
	return new Hash(algorithm, options);
};


class KeyedHash extends LazyTransform {
	constructor(algorithm, key, options) {
		super(options);
		this._handle = new binding.Hash(algorithm, key);
	}
}

KeyedHash.prototype.update = Hash.prototype.update;
KeyedHash.prototype.digest = Hash.prototype.digest;
KeyedHash.prototype._flush = Hash.prototype._flush;
KeyedHash.prototype._transform = Hash.prototype._transform;

exports.KeyedHash = KeyedHash;
exports.createKeyedHash = function(algorithm, key, options) {
	return new KeyedHash(algorithm, key, options);
};
