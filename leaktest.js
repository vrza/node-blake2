#!/usr/bin/env node

/**
 * Creates Hashes and KeyedHashes in an infinite loop; use `ps u | grep leaktest`
 * to verify lack of memory leaks
 */

"use strict";

const blake2 = require('./index');

function randomElement(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

const algos = ['blake2b', 'blake2s', 'blake2bp', 'blake2sp'];
const encodings = [undefined, 'hex', 'base64', 'binary'];
let input = Buffer.from(String(Math.random()));
while(1) {
	let hash = new blake2.Hash(randomElement(algos));
	hash.update(input);
	input = hash.digest(randomElement(encodings));
	hash = hash.copy(); // Exercise copy as well
	if(typeof input === 'string') {
		input = Buffer.from(input.substr(0, 16));
	}

	hash = new blake2.KeyedHash(randomElement(algos), Buffer.from(String(Math.random())));
	hash.update(input);
	hash = hash.copy(); // Exercise copy as well
	input = hash.digest(randomElement(encodings));
	if(typeof input === 'string') {
		input = Buffer.from(input.substr(0, 16));
	}
}
